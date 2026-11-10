import { asyncHandler, HttpError, eventStream, CrudRoutes } from "express-web-tools"
import { Router } from "express";
import webpush from 'web-push';
import controller from "./controller.js";
import subscriberController from "../subscriber/controller.js";
import isAuthenticated from "../../auth/user/guard.js";
import { authorize } from "../../auth/user/authorize.js";
import notificationModel from "./model.js";
import { assertDailyNotificationCapacity } from "../../auth/organization/quotas.js";
import { getWorkspaceVapidDetails } from "../vapid.js";

class NotifyCrudRoutes extends CrudRoutes {
    async add(req, res) {
        controller.request = req;
        subscriberController.request = req;
        const startOfDayUtc = new Date();
        startOfDayUtc.setUTCHours(0, 0, 0, 0);
        const usedToday = await notificationModel.countDocuments({
            origin: req.origin,
            createdAt: { $gte: startOfDayUtc }
        });
        await assertDailyNotificationCapacity(req.origin, usedToday);
        const vapid = await getWorkspaceVapidDetails(req.origin);
        const notification = await controller.create(req.body);
        const subscribers = await subscriberController.list();
        eventStream.emit("notify-web-push", {
            ...req.body,
            vapid,
            subscribers,
            origin: req.origin
        });
        return res.json({
            status: "success",
            message: "",
            data: notification
        })
    }
}
const routes = new NotifyCrudRoutes(
    "",
    controller,
    {
        global: [isAuthenticated, authorize("web-push:notify", "edit:organization")]
    }
);
const router = routes.publish();
eventStream.addListener(
    "notify-web-push",
    async data => {
        const { title, body, url, tag } = data;
        const payload = JSON.stringify({ title, body, url, tag });
        const results = await Promise.all(
            data.subscribers.map(async (sub) => {
                await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload, {
                    TTL: 60 * 60,
                    urgency: 'normal',
                    vapidDetails: data.vapid
                });
            })
        )
        console.log(results)
    }
)
export default router;