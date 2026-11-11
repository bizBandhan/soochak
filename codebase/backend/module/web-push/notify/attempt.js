import mongoose from "mongoose";

const schema = new mongoose.Schema({
    origin: { type: String, required: true },
    notification: { type: mongoose.Schema.Types.ObjectId, required: true },
    subscriber: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ["queued", "attempted", "accepted", "failed", "expired", "unknown"], required: true },
    attemptedAt: Date,
    finishedAt: Date,
    providerStatus: Number
}, { timestamps: true, versionKey: false });

schema.index({ origin: 1, notification: 1, subscriber: 1 }, { unique: true });
export default mongoose.model("NotificationAttempt", schema);
