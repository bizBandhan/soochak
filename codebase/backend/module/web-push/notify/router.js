import { asyncHandler, HttpError, eventStream } from "express-web-tools"
import { Router } from "express";
import webpush from 'web-push';
import controller from "./controller.js";
import subscriberController from "../subscriber/controller.js";

const router = Router();

eventStream.addListener(
    "notify-web-push",
    async data => {
        webpush.setVapidDetails(
            "mailto:info@bizbandhan.com",
            data.vapid.publicKey,
            data.vapid.privateKey
        );
        // 
        const { title, body, url, tag } = data;
        const payload = JSON.stringify({ title, body, url, tag });
        const results = await Promise.all(
            data.subscribers.map(async (sub) => {
                await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload, {
                    TTL: 60 * 60,
                    urgency: 'normal'
                });
            })
        )
        console.log(results)
    }
)
router
    .route('')
    .get(
        asyncHandler(
            async (req, res) => {
                throw new HttpError(502, "under development")
            }
        )
    )
    .post(
        asyncHandler(
            async (req, res) => {
                throw new HttpError(502, "under development")
            }
        )
    )
    .put(
        asyncHandler(
            async (req, res) => {
                controller.request = req;
                subscriberController.request = req;
                let subscribers = await subscriberController.list();
                eventStream.emit("notify-web-push", { ...req.body, vapid: req.vapid, subscribers })
                return res.json({
                    status: "success",
                    message: "",
                    data: await controller.create(req.body)
                })
                throw new HttpError(502, "under development")
            }
        )
    )
    .patch(
        asyncHandler(
            async (req, res) => {
                throw new HttpError(502, "under development")
            }
        )
    )
    .delete(
        asyncHandler(
            async (req, res) => {
                throw new HttpError(502, "under development")
            }
        )
    )

export default router;
