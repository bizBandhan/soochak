import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import mongoose from "mongoose";
import notificationModel from "../module/web-push/notify/model.js";
import attemptModel from "../module/web-push/notify/attempt.js";
import { dispatchNotification, getDeliverySummary, STALE_AFTER_MS } from "../module/web-push/notify/delivery.js";

const origin = `notification-${randomBytes(8).toString("hex")}.example.test`;
let notification;
const subscribers = Array.from({ length: 5 }, (_, i) => ({
    _id: new mongoose.Types.ObjectId(), endpoint: `https://push.example.test/${i}`, keys: { p256dh: "test", auth: "test" }
}));

before(async () => {
    await mongoose.connect(process.env.DB, { dbName: "soochak_notification_tests" });
    const now = new Date();
    notification = await notificationModel.create({
        origin, title: "Test", body: "Test", url: "https://example.test/",
        trackingStartedAt: now, trackingHeartbeatAt: now
    });
    await attemptModel.insertMany(subscribers.map(sub => ({
        origin, notification: notification._id, subscriber: sub._id, status: "queued"
    })));
});

after(async () => {
    await attemptModel.deleteMany({ origin });
    await notificationModel.deleteMany({ origin });
    await mongoose.disconnect();
});

test("records provider acceptance, rejection, expiry and uncertain network outcomes", async () => {
    const seen = [];
    await dispatchNotification({
        notification, subscribers, origin, vapid: {},
        send: async (sub) => {
            seen.push(sub.endpoint);
            const index = Number(sub.endpoint.split("/").at(-1));
            if (index === 1) throw Object.assign(new Error("provider"), { statusCode: 503 });
            if (index === 2) throw Object.assign(new Error("expired"), { statusCode: 410 });
            if (index === 3) throw new Error("network");
        }
    });
    assert.equal(seen.length, 5);
    const summary = await getDeliverySummary(origin, notification);
    assert.deepEqual(summary, { available: true, total: 5, queued: 0, attempted: 0, accepted: 2, failed: 1, expired: 1, unknown: 1 });
    assert.deepEqual(await getDeliverySummary("another-workspace", notification), {
        available: true, total: 0, queued: 0, attempted: 0, accepted: 0, failed: 0, expired: 0, unknown: 0
    });
    const stored = await attemptModel.find({ origin }).lean();
    assert.ok(stored.every(item => !("endpoint" in item) && !("keys" in item)));
});

test("stale in-progress attempts are reported as unknown and never automatically resent", async () => {
    await attemptModel.updateMany({ origin }, { $set: { status: "queued" } });
    await attemptModel.updateOne({ origin, subscriber: subscribers[0]._id }, { $set: { status: "attempted" } });
    const stale = { ...notification.toObject(), trackingHeartbeatAt: new Date(Date.now() - STALE_AFTER_MS - 1) };
    assert.deepEqual(await getDeliverySummary(origin, stale), {
        available: true, total: 5, queued: 0, attempted: 0, accepted: 0, failed: 0, expired: 0, unknown: 5
    });
    assert.equal(await attemptModel.countDocuments({ origin, status: "queued" }), 4);
    assert.deepEqual(await getDeliverySummary(origin, { _id: notification._id }), { available: false });
});
