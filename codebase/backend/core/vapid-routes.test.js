import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import dns from "node:dns";
import http from "node:http";
import { after, before, test } from "node:test";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import express from "express";
import mongoose from "mongoose";
import webpush from "web-push";
import organizationModel from "../module/auth/organization/model.js";
import { deleteVapidKeys } from "../module/web-push/vapid.js";
import { corsMiddleware, protectPublicPushOrigins } from "./cors.js";

const suffix = randomBytes(8).toString("hex");
const signupHost = "soochak.test";
const workspace = `vapid-${suffix}.${signupHost}`;
const legacyWorkspace = `legacy-${suffix}.${signupHost}`;
const configWorkspace = `config-${suffix}.${signupHost}`;
const failedWorkspace = `failed-${suffix}.${signupHost}`;
const testWorkspaces = [workspace, legacyWorkspace, configWorkspace, failedWorkspace];
const legacyId = new mongoose.Types.ObjectId();
const configId = new mongoose.Types.ObjectId();
let server;
let baseUrl;

const request = (host, path, options = {}) => new Promise((resolve, reject) => {
    const req = http.request(`${baseUrl}${path}`, {
        method: options.method || "GET",
        headers: { host, "content-type": "application/json", ...options.headers }
    }, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, json: async () => JSON.parse(body) }));
        res.on("error", reject);
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
});

before(async () => {
    process.env.HOSTED_DOMAIN = signupHost;
    process.env.VAPID_ENCRYPTION_KEY = randomBytes(32).toString("hex");
    await mongoose.connect(process.env.DB, { dbName: "soochak_vapid_tests" });
    const resolveMx = dns.resolveMx;
    dns.resolveMx = (domain, callback) => callback(null, [{ exchange: "mx.example.test", priority: 10 }]);
    let routes;
    let userModel;
    try {
        ({ default: routes } = await import("../module/index.js"));
        ({ default: userModel } = await import("../module/auth/user/model.js"));
    } finally {
        dns.resolveMx = resolveMx;
    }
    await organizationModel.collection.insertMany([
        { _id: legacyId, origin: legacyWorkspace, name: "Legacy", slug: `legacy-${suffix}` },
        { _id: configId, origin: configWorkspace, name: "Config", slug: `config-${suffix}` }
    ]);
    await userModel.collection.insertOne({
        origin: legacyWorkspace, user: "test-owner", password: await bcrypt.hash("test-password", 10),
        name: { first: "Test", last: "Owner" }, email: "test@example.com", role: "owner", dob: new Date("1990-01-01"),
        createdAt: new Date(), updatedAt: new Date()
    });
    const app = express();
    app.use(express.json(), corsMiddleware, protectPublicPushOrigins, cookieParser(), (req, res, next) => {
        req.origin = req.host;
        next();
    }, routes);
    app.use((err, req, res, next) => res.status(err.status || 500).json({ message: err.message }));
    server = await new Promise((resolve) => {
        const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (server) await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    if (mongoose.connection.readyState === 1) {
        const organizations = await organizationModel.collection.find({
            origin: { $in: testWorkspaces }
        }).toArray();
        await Promise.all(organizations.map((org) => deleteVapidKeys(org._id)));
        for (const modelName of ["Organization", "User", "Role", "Permission"]) {
            await mongoose.model(modelName).collection.deleteMany({ origin: { $in: testWorkspaces } });
        }
        await mongoose.model("WebPushSite").collection.deleteMany({ workspace: { $in: testWorkspaces } });
        await mongoose.model("Subscriber").collection.deleteMany({ origin: { $in: testWorkspaces } });
        await mongoose.model("Notify").collection.deleteMany({ origin: { $in: testWorkspaces } });
        await mongoose.model("NotificationAttempt").collection.deleteMany({ origin: { $in: testWorkspaces } });
        await mongoose.disconnect();
    }
});

test("registration creates a workspace key and config returns only its public key", async () => {
    const response = await request(signupHost, "/api/v1/auth/organization", {
        method: "PUT",
        body: JSON.stringify({
            name: `Test ${suffix}`,
            slug: `vapid-${suffix}`,
            owner: {
                user: `owner-${suffix}`, password: "test-password",
                name: { first: "Test", last: "Owner" },
                sex: "other", dob: "1990-01-01", email: "test@example.test"
            }
        })
    });
    const body = await response.json();
    assert.equal(response.status, 201, JSON.stringify(body));
    const org = await organizationModel.collection.findOne({ origin: workspace });
    assert.ok(org);
    const record = await mongoose.connection.collection("organizationvapidkeys").findOne({ _id: org._id });
    assert.ok(record);
    assert.equal(JSON.stringify(body).includes(record.encryptedPrivateKey), false);
    const config = await request(workspace, "/api/v1/web-push/config");
    const publicResponse = await config.json();
    assert.equal(config.status, 200);
    assert.equal(publicResponse.data, record.publicKey);
    assert.equal(JSON.stringify(publicResponse).includes(record.encryptedPrivateKey), false);
});

test("notification API persists and scopes provider statuses", async () => {
    const login = await request(workspace, "/api/v1/auth", {
        method: "PUT", body: JSON.stringify({ user: `owner-${suffix}`, password: "test-password" })
    });
    assert.equal(login.status, 200);
    const cookie = login.headers["set-cookie"][0].split(";")[0];
    const headers = { cookie, origin: `https://${workspace}` };
    const originalSend = webpush.sendNotification;
    let calls = 0;
    webpush.sendNotification = async () => { calls++; };
    try {
        await mongoose.model("Subscriber").collection.insertOne({
            origin: workspace, endpoint: "https://push.example.test/status-test",
            keys: { p256dh: "test", auth: "test" }
        });
        const created = await request(workspace, "/api/v1/web-push/notify", {
            method: "PUT", headers,
            body: JSON.stringify({ title: "Test", body: "Test", url: "https://example.test/" })
        });
        const record = (await created.json()).data;
        assert.equal(created.status, 200);
        assert.ok(record._id);
        let summary;
        for (let i = 0; i < 50; i++) {
            const response = await request(workspace, `/api/v1/web-push/notify/${record._id}/status`, { headers });
            assert.equal(response.status, 200);
            summary = (await response.json()).data;
            if (summary.accepted === 1) break;
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        assert.deepEqual(summary, { available: true, total: 1, queued: 0, attempted: 0, accepted: 1, failed: 0, expired: 0, unknown: 0 });
        assert.equal(calls, 1);
        const unauthenticated = await request(workspace, `/api/v1/web-push/notify/${record._id}/status`);
        assert.equal(unauthenticated.status, 401);
        const wrongHost = await request(configWorkspace, `/api/v1/web-push/notify/${record._id}/status`, { headers });
        assert.notEqual(wrongHost.status, 200);
        const badId = await request(workspace, "/api/v1/web-push/notify/not-an-id/status", { headers });
        assert.equal(badId.status, 400);
    } finally {
        webpush.sendNotification = originalSend;
        await mongoose.model("Subscriber").collection.deleteMany({ origin: workspace });
    }
});

test("public configuration initializes a missing key without login", async () => {
    const config = await request(configWorkspace, "/api/v1/web-push/config");
    const body = await config.json();
    assert.equal(config.status, 200);
    const record = await mongoose.connection.collection("organizationvapidkeys").findOne({ _id: configId });
    assert.equal(body.data, record.publicKey);
    assert.deepEqual(Object.keys(body).sort(), ["data", "message", "status"]);
});

test("registration rolls back if VAPID key generation fails", async () => {
    const encryptionKey = process.env.VAPID_ENCRYPTION_KEY;
    process.env.VAPID_ENCRYPTION_KEY = "invalid";
    try {
        const response = await request(signupHost, "/api/v1/auth/organization", {
            method: "PUT",
            body: JSON.stringify({
                name: `Failed ${suffix}`, slug: `failed-${suffix}`,
                owner: {
                    user: `failed-${suffix}`, password: "test-password",
                    name: { first: "Test", last: "Owner" },
                    sex: "other", dob: "1990-01-01", email: "test@example.test"
                }
            })
        });
        assert.equal(response.status, 500);
        assert.equal(await organizationModel.collection.findOne({ origin: failedWorkspace }), null);
    } finally {
        process.env.VAPID_ENCRYPTION_KEY = encryptionKey;
    }
});

test("registered origins can use only the workspace public push routes", async () => {
    const login = await request(workspace, "/api/v1/auth", {
        method: "PUT", body: JSON.stringify({ user: `owner-${suffix}`, password: "test-password" })
    });
    assert.equal(login.status, 200);
    const cookie = login.headers["set-cookie"][0].split(";")[0];
    const headers = { cookie, origin: `https://${workspace}` };
    const create = await request(workspace, "/api/v1/web-push/site", {
        method: "PUT", headers,
        body: JSON.stringify({ name: "Example", origin: "https://example.test", serviceWorkerPath: "/sw.js" })
    });
    assert.equal(create.status, 201, JSON.stringify(await create.json()));
    const site = (await create.json()).data;
    const list = await request(workspace, "/api/v1/web-push/site", { headers });
    assert.equal((await list.json()).data[0]._id, site._id);
    const filter = await request(workspace, "/api/v1/web-push/site", {
        method: "POST", headers, body: JSON.stringify({ origin: "https://example.test" })
    });
    assert.equal((await filter.json()).data.length, 1);
    const unsafeFilter = await request(workspace, "/api/v1/web-push/site", {
        method: "POST", headers, body: JSON.stringify({ workspace: configWorkspace })
    });
    assert.equal(unsafeFilter.status, 400);
    const invalid = await request(workspace, "/api/v1/web-push/site", {
        method: "PUT", headers,
        body: JSON.stringify({ name: "Invalid", origin: "https://example.test/path", serviceWorkerPath: "/sw.js" })
    });
    assert.equal(invalid.status, 400);
    const duplicate = await request(workspace, "/api/v1/web-push/site", {
        method: "PUT", headers,
        body: JSON.stringify({ name: "Duplicate", origin: "https://example.test", serviceWorkerPath: "/sw.js" })
    });
    assert.equal(duplicate.status, 409);

    const preflight = await request(workspace, "/api/v1/web-push/subscriber", {
        method: "OPTIONS", headers: { origin: "https://example.test", "access-control-request-method": "PUT", "access-control-request-headers": "content-type" }
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers["access-control-allow-origin"], "https://example.test");
    assert.equal(preflight.headers["access-control-allow-credentials"], undefined);
    assert.match(preflight.headers.vary, /Origin/i);
    const deniedPreflight = await request(workspace, "/api/v1/auth/organization", {
        method: "OPTIONS", headers: { origin: "https://example.test", "access-control-request-method": "PUT" }
    });
    assert.equal(deniedPreflight.headers["access-control-allow-origin"], undefined);
    const createSubscriber = await request(workspace, "/api/v1/web-push/subscriber", {
        method: "PUT", headers: { origin: "https://example.test" },
        body: JSON.stringify({ endpoint: `https://push.example.test/${suffix}`, keys: { p256dh: "key", auth: "auth" } })
    });
    assert.equal(createSubscriber.status, 201, JSON.stringify(await createSubscriber.json()));
    assert.equal(createSubscriber.headers["access-control-allow-origin"], "https://example.test");
    const subscriber = (await createSubscriber.json()).data;
    const removeSubscriber = await request(workspace, `/api/v1/web-push/subscriber/${subscriber._id}`, {
        method: "DELETE", headers: { origin: "https://example.test" }
    });
    assert.equal(removeSubscriber.status, 200);
    assert.equal(removeSubscriber.headers["access-control-allow-origin"], "https://example.test");
    const blocked = await request(workspace, "/api/v1/web-push/subscriber", {
        method: "PUT", headers: { origin: "https://other.example.test" }, body: "{}"
    });
    assert.equal(blocked.status, 403);
    const otherWorkspace = await request(configWorkspace, "/api/v1/web-push/config", { headers: { origin: "https://example.test" } });
    assert.equal(otherWorkspace.status, 403);
    const protectedRoute = await request(workspace, "/api/v1/auth/organization", { headers: { origin: "https://example.test" } });
    assert.equal(protectedRoute.headers["access-control-allow-origin"], undefined);
    const updateSite = await request(workspace, `/api/v1/web-push/site/${site._id}`, {
        method: "PUT", headers,
        body: JSON.stringify({ name: "Updated", origin: "https://new.example.test", serviceWorkerPath: "/sw.js" })
    });
    assert.equal(updateSite.status, 200);
    const oldOrigin = await request(workspace, "/api/v1/web-push/config", { headers: { origin: "https://example.test" } });
    assert.equal(oldOrigin.status, 403);
    const newOrigin = await request(workspace, "/api/v1/web-push/config", { headers: { origin: "https://new.example.test" } });
    assert.equal(newOrigin.headers["access-control-allow-origin"], "https://new.example.test");
    const crossWorkspace = await request(configWorkspace, `/api/v1/web-push/site/${site._id}`, { headers });
    assert.notEqual(crossWorkspace.status, 200);
    const deleteSite = await request(workspace, `/api/v1/web-push/site/${site._id}`, { method: "DELETE", headers });
    assert.equal(deleteSite.status, 200);
    const afterRemoval = await request(workspace, "/api/v1/web-push/config", { headers: { origin: "https://new.example.test" } });
    assert.equal(afterRemoval.status, 403);
});

test("successful login creates missing workspace keys", async () => {
    const invalid = await request(legacyWorkspace, "/api/v1/auth", {
        method: "PUT",
        body: JSON.stringify({ user: "test-owner", password: "wrong-password" })
    });
    assert.equal(invalid.status, 401);
    assert.equal(await mongoose.connection.collection("organizationvapidkeys").findOne({ _id: legacyId }), null);

    const response = await request(legacyWorkspace, "/api/v1/auth", {
        method: "PUT",
        body: JSON.stringify({ user: "test-owner", password: "test-password" })
    });
    assert.equal(response.status, 200, JSON.stringify(await response.json()));
    const record = await mongoose.connection.collection("organizationvapidkeys").findOne({ _id: legacyId });
    assert.ok(record);
    const config = await request(legacyWorkspace, "/api/v1/web-push/config");
    assert.equal((await config.json()).data, record.publicKey);

    await deleteVapidKeys(legacyId);
    const session = await request(legacyWorkspace, "/api/v1/me", {
        headers: { cookie: response.headers["set-cookie"][0].split(";")[0] }
    });
    assert.equal(session.status, 200);
    const restored = await mongoose.connection.collection("organizationvapidkeys").findOne({ _id: legacyId });
    assert.ok(restored);
});
