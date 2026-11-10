import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import mongoose from "mongoose";
import webpush from "web-push";
import organizationModel from "../auth/organization/model.js";
import { httpError } from "../auth/user/validation.js";

const keySchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    publicKey: { type: String, required: true },
    encryptedPrivateKey: { type: String, required: true, select: false },
    iv: { type: String, required: true, select: false },
    tag: { type: String, required: true, select: false }
}, { versionKey: false });

const keyModel = mongoose.model("OrganizationVapidKey", keySchema);

function encryptionKey() {
    const value = process.env.VAPID_ENCRYPTION_KEY;
    if (typeof value !== "string" || !/^[0-9a-f]{64}$/i.test(value)) {
        throw new Error("VAPID_ENCRYPTION_KEY must be 32 random bytes encoded as 64 hexadecimal characters");
    }
    return Buffer.from(value, "hex");
}

export function generateVapidKeys(organizationId) {
    const keys = webpush.generateVAPIDKeys();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
    cipher.setAAD(Buffer.from(String(organizationId)));
    const ciphertext = Buffer.concat([cipher.update(keys.privateKey, "utf8"), cipher.final()]);
    return {
        publicKey: keys.publicKey,
        encryptedPrivateKey: ciphertext.toString("base64"),
        iv: iv.toString("base64"),
        tag: cipher.getAuthTag().toString("base64")
    };
}

export async function ensureVapidKeys(organizationId) {
    const existing = await keyModel.findById(organizationId);
    if (existing) return existing.publicKey;

    const generated = generateVapidKeys(organizationId);
    try {
        const record = await keyModel.findOneAndUpdate(
            { _id: organizationId },
            { $setOnInsert: generated },
            { upsert: true, returnDocument: "after", runValidators: true }
        );
        return record.publicKey;
    } catch (error) {
        if (error.code !== 11000) throw error;
        const record = await keyModel.findById(organizationId);
        if (!record) throw error;
        return record.publicKey;
    }
}

export async function ensureWorkspaceVapidKeys(origin) {
    const organization = await organizationModel.findOne({ origin });
    if (!organization) throw httpError(404, "Organization not found for this workspace");
    return ensureVapidKeys(organization._id);
}

export async function getWorkspaceVapidDetails(origin) {
    const organization = await organizationModel.findOne({ origin });
    if (!organization) throw httpError(404, "Organization not found for this workspace");
    await ensureVapidKeys(organization._id);
    const record = await keyModel.findById(organization._id)
        .select("+encryptedPrivateKey +iv +tag");
    if (!record) throw new Error("Organization VAPID keys are unavailable");
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(record.iv, "base64"));
    decipher.setAAD(Buffer.from(String(organization._id)));
    decipher.setAuthTag(Buffer.from(record.tag, "base64"));
    const privateKey = Buffer.concat([
        decipher.update(Buffer.from(record.encryptedPrivateKey, "base64")),
        decipher.final()
    ]).toString("utf8");
    return { subject: "mailto:info@bizbandhan.com", publicKey: record.publicKey, privateKey };
}

export async function deleteVapidKeys(organizationId) {
    await keyModel.deleteOne({ _id: organizationId });
}
