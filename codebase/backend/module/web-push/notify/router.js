import { asyncHandler, CrudRoutes } from "express-web-tools";
import { Router } from "express";
import mongoose from "mongoose";
import controller from "./controller.js";
import notificationModel from "./model.js";
import subscriberModel from "../subscriber/model.js";
import attemptModel from "./attempt.js";
import { dispatchNotification, getDeliverySummary } from "./delivery.js";
import isAuthenticated from "../../auth/user/guard.js";
import { authorize } from "../../auth/user/authorize.js";
import { assertDailyNotificationCapacity } from "../../auth/organization/quotas.js";
import { getWorkspaceVapidDetails } from "../vapid.js";

class NotifyCrudRoutes extends CrudRoutes {
    async add(req, res) {
        const startOfDayUtc = new Date();
        startOfDayUtc.setUTCHours(0, 0, 0, 0);
        const usedToday = await notificationModel.countDocuments({
            origin: req.origin, createdAt: { $gte: startOfDayUtc }
        });
        await assertDailyNotificationCapacity(req.origin, usedToday);
        const vapid = await getWorkspaceVapidDetails(req.origin);
        const subscribers = await subscriberModel.find({ origin: req.origin }).lean();
        const { title, body, url, tag } = req.body;
        const notification = await notificationModel.create({
            origin: req.origin, title, body, url, tag
        });
        try {
            if (subscribers.length) {
                await attemptModel.insertMany(subscribers.map((sub) => ({
                    origin: req.origin, notification: notification._id, subscriber: sub._id, status: "queued"
                })));
            }
            const now = new Date();
            notification.trackingStartedAt = now;
            notification.trackingHeartbeatAt = now;
            await notification.save();
        } catch (error) {
            try {
                await attemptModel.deleteMany({ origin: req.origin, notification: notification._id });
                await notificationModel.deleteOne({ origin: req.origin, _id: notification._id });
            } catch (cleanupError) {
                console.error(JSON.stringify({ event: "notification-setup-cleanup-failed", notificationId: String(notification._id), error: { name: cleanupError?.name, code: cleanupError?.code } }));
            }
            throw error;
        }
        setImmediate(() => {
            void dispatchNotification({ notification, subscribers, vapid, origin: req.origin }).catch((error) => {
                console.error(JSON.stringify({ event: "notification-dispatch-failed", notificationId: String(notification._id), error: { name: error?.name, code: error?.code } }));
            });
        });
        return res.json({ status: "success", message: "", data: notification });
    }
}

const router = Router();
router.get("/:id/status", isAuthenticated, authorize("web-push:notify", "edit:organization"), asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ status: "error", message: "Invalid notification ID" });
    }
    const notification = await notificationModel.findOne({ _id: req.params.id, origin: req.origin }).lean();
    if (!notification) return res.status(404).json({ status: "error", message: "Notification not found" });
    return res.json({ status: "success", data: await getDeliverySummary(req.origin, notification) });
}));
router.use(new NotifyCrudRoutes("", controller, {
    global: [isAuthenticated, authorize("web-push:notify", "edit:organization")]
}).publish());

export default router;
