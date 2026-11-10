import mongoose from "mongoose";

const schema = new mongoose.Schema({
    workspace: { type: String, required: true, immutable: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    origin: { type: String, required: true },
    serviceWorkerPath: { type: String, required: true }
}, { timestamps: true, versionKey: false });

schema.index({ workspace: 1, origin: 1 }, { unique: true });

export default mongoose.model("WebPushSite", schema);
