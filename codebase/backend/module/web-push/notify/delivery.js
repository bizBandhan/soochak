import webpush from "web-push";
import notificationModel from "./model.js";
import attemptModel from "./attempt.js";

export const STALE_AFTER_MS = 120_000;
const CONCURRENCY = 10;

function logFailure(event, error, notificationId) {
    console.error(JSON.stringify({
        time: new Date().toISOString(), event, notificationId: String(notificationId),
        error: { name: error?.name ?? "Error", code: error?.code }
    }));
}

export async function dispatchNotification({ notification, subscribers, vapid, origin, send = webpush.sendNotification }) {
    const filter = { _id: notification._id, origin };
    const heartbeat = async () => {
        await notificationModel.updateOne(filter, { $set: { trackingHeartbeatAt: new Date() } });
    };
    const timer = setInterval(() => {
        void heartbeat().catch((error) => logFailure("notification-heartbeat-failed", error, notification._id));
    }, 30_000);
    timer.unref();
    const payload = JSON.stringify({
        title: notification.title, body: notification.body, url: notification.url, tag: notification.tag
    });
    let next = 0;
    async function worker() {
        while (next < subscribers.length) {
            const sub = subscribers[next++];
            const attemptFilter = { origin, notification: notification._id, subscriber: sub._id };
            try {
                const started = await attemptModel.updateOne(
                    { ...attemptFilter, status: "queued" },
                    { $set: { status: "attempted", attemptedAt: new Date() } }
                );
                if (started.modifiedCount !== 1) continue;
                let result;
                try {
                    await send({ endpoint: sub.endpoint, keys: sub.keys }, payload, {
                        TTL: 3600, urgency: "normal", vapidDetails: vapid, timeout: 15000
                    });
                    result = { status: "accepted", finishedAt: new Date() };
                } catch (error) {
                    const code = error?.statusCode;
                    result = {
                        status: code === 404 || code === 410 ? "expired" :
                            Number.isInteger(code) ? "failed" : "unknown",
                        finishedAt: new Date(),
                        ...(Number.isInteger(code) ? { providerStatus: code } : {})
                    };
                    logFailure("notification-provider-send-failed", error, notification._id);
                }
                await attemptModel.updateOne(attemptFilter, { $set: result });
            } catch (error) {
                logFailure("notification-attempt-update-failed", error, notification._id);
            }
        }
    }
    try {
        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, subscribers.length) }, () => worker()));
    } finally {
        clearInterval(timer);
        await heartbeat();
    }
}

export async function getDeliverySummary(origin, notification) {
    if (!notification.trackingStartedAt) return { available: false };
    const counts = { queued: 0, attempted: 0, accepted: 0, failed: 0, expired: 0, unknown: 0 };
    const groups = await attemptModel.aggregate([
        { $match: { origin, notification: notification._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    for (const group of groups) {
        if (Object.hasOwn(counts, group._id)) counts[group._id] = group.count;
    }
    const heartbeat = notification.trackingHeartbeatAt ?? notification.trackingStartedAt;
    if (Date.now() - new Date(heartbeat).getTime() > STALE_AFTER_MS) {
        counts.unknown += counts.queued + counts.attempted;
        counts.queued = 0;
        counts.attempted = 0;
    }
    return { available: true, total: Object.values(counts).reduce((sum, count) => sum + count, 0), ...counts };
}
