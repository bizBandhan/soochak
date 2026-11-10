import assert from "node:assert/strict";
import { createECDH, randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import mongoose from "mongoose";
import webpush from "web-push";
import organizationModel from "../module/auth/organization/model.js";
import {
    deleteVapidKeys,
    ensureVapidKeys,
    ensureWorkspaceVapidKeys,
    getWorkspaceVapidDetails
} from "../module/web-push/vapid.js";

const ids = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
const suffix = randomBytes(12).toString("hex");
const origins = [`vapid-a-${suffix}.test`, `vapid-b-${suffix}.test`];

before(async () => {
    process.env.VAPID_ENCRYPTION_KEY = randomBytes(32).toString("hex");
    await mongoose.connect(process.env.DB, { dbName: "soochak_vapid_tests" });
    await organizationModel.collection.insertMany(ids.map((_id, index) => ({
        _id, origin: origins[index], name: `Test ${index}`, slug: `test-${index}`
    })));
});

after(async () => {
    if (mongoose.connection.readyState === 1) {
        await Promise.all(ids.map(deleteVapidKeys));
        await organizationModel.collection.deleteMany({ _id: { $in: ids } });
        await mongoose.disconnect();
    }
});

test("generates stable, isolated keys atomically and encrypts the private key", async () => {
    const publicKeys = await Promise.all(
        Array.from({ length: 12 }, () => ensureWorkspaceVapidKeys(origins[0]))
    );
    assert.equal(new Set(publicKeys).size, 1);
    assert.equal(await ensureVapidKeys(ids[0]), publicKeys[0]);
    assert.notEqual(await ensureWorkspaceVapidKeys(origins[1]), publicKeys[0]);

    const details = await getWorkspaceVapidDetails(origins[0]);
    assert.equal(details.publicKey, publicKeys[0]);
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(Buffer.from(details.privateKey, "base64url"));
    assert.equal(ecdh.getPublicKey().toString("base64url"), details.publicKey);
    const otherDetails = await getWorkspaceVapidDetails(origins[1]);
    const subscription = {
        endpoint: "https://push.example.test/subscription",
        keys: {
            p256dh: createECDH("prime256v1").generateKeys().toString("base64url"),
            auth: randomBytes(16).toString("base64url")
        }
    };
    const firstRequest = webpush.generateRequestDetails(subscription, "test", { vapidDetails: details });
    const secondRequest = webpush.generateRequestDetails(subscription, "test", { vapidDetails: otherDetails });
    assert.ok(firstRequest.headers.Authorization.includes(details.publicKey));
    assert.ok(secondRequest.headers.Authorization.includes(otherDetails.publicKey));

    const stored = await mongoose.connection.collection("organizationvapidkeys").findOne({ _id: ids[0] });
    assert.ok(stored.encryptedPrivateKey);
    assert.equal(JSON.stringify(stored).includes(details.privateKey), false);
    assert.equal((await mongoose.model("OrganizationVapidKey").findById(ids[0])).encryptedPrivateKey, undefined);
});

test("does not create keys for unknown workspaces or hide decryption failures", async () => {
    await assert.rejects(ensureWorkspaceVapidKeys(`unknown-${suffix}.test`), /Organization not found/);
    process.env.VAPID_ENCRYPTION_KEY = randomBytes(32).toString("hex");
    await assert.rejects(getWorkspaceVapidDetails(origins[0]));
    assert.equal(await ensureWorkspaceVapidKeys(origins[0]), await ensureVapidKeys(ids[0]));
});
