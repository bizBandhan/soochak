import { Router } from "express";
import userModel from "../user/model.js";
import isAuthenticated from "../user/guard.js";
import { startSession, endSession } from "../user/session.js";
import { serializeUser } from "../user/serializer.js";
import { httpError, buildProfileUpdate, saveProfileUpdate, MIN_PASSWORD_LENGTH } from "../user/validation.js";
import { ensureWorkspaceVapidKeys } from "../../web-push/vapid.js";

const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

const MAX_FAILED_LOGINS = 5;
const LOGIN_WINDOW_MS = 60 * 1000;
const failedLogins = new Map();

const attemptKey = (req, user) => `${req.origin}|${user}|${req.ip}`;

const isBlocked = (key) => {
    const entry = failedLogins.get(key);
    if (!entry) return false;
    if (Date.now() - entry.since > LOGIN_WINDOW_MS) {
        failedLogins.delete(key);
        return false;
    }
    return entry.count >= MAX_FAILED_LOGINS;
};

const recordFailure = (key) => {
    const entry = failedLogins.get(key);
    if (!entry || Date.now() - entry.since > LOGIN_WINDOW_MS) {
        failedLogins.set(key, { count: 1, since: Date.now() });
    } else {
        entry.count += 1;
    }
};

const login = handle(async (req, res) => {
    const { user, password } = req.body ?? {};
    if (typeof user !== "string" || !user.trim() || typeof password !== "string" || !password) {
        throw httpError(400, "Username and password are required");
    }

    const key = attemptKey(req, user.trim());
    if (isBlocked(key)) {
        throw httpError(429, "Too many login attempts. Please wait 60 seconds before trying again.");
    }

    const account = await userModel.findOne({ user: user.trim(), origin: req.origin }).select("+dob");
    let verified = false;
    if (account) {
        // An account without a password is inactive; treat it like a wrong password.
        verified = await account.verifyPassword(password).catch(() => false);
    }
    if (!verified) {
        recordFailure(key);
        throw httpError(401, "Username or password is not correct");
    }

    failedLogins.delete(key);
    await ensureWorkspaceVapidKeys(req.origin);
    const expiresAt = startSession(req, res, account);
    return res.json({
        status: "success",
        message: "Logged in",
        data: { authenticated: true, expiresAt, user: serializeUser(account, req.origin) }
    });
});

const status = handle(async (req, res) => {
    await ensureWorkspaceVapidKeys(req.origin);
    return res.json({
        status: "success",
        message: "",
        data: { authenticated: true, user: serializeUser(req.user, req.origin) }
    });
});

// Tokens are stateless JWTs, so logout clears the cookie; it is safe to call without a session.
const logout = (req, res) => {
    endSession(req, res);
    return res.status(204).end();
};

// Only these fields are editable by the user; role, password, dob and tenant fields never are.
const PROFILE_FIELDS = ["name", "email", "phone", "timezone", "profilePicture"];

const updateProfile = handle(async (req, res) => {
    const changes = buildProfileUpdate(req.body, PROFILE_FIELDS);
    const account = await userModel.findOne({ _id: req.user._id, origin: req.origin });
    if (!account) throw httpError(401, "Unauthorized");

    await saveProfileUpdate(account, changes);
    return res.json({
        status: "success",
        message: "Profile updated",
        data: { authenticated: true, user: serializeUser(account, req.origin) }
    });
});

const changePassword = handle(async (req, res) => {
    const { currentPassword, newPassword } = req.body ?? {};
    if (typeof currentPassword !== "string" || !currentPassword || typeof newPassword !== "string" || !newPassword) {
        throw httpError(400, "Current and new password are required");
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
        throw httpError(400, `New password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
    }
    if (newPassword === currentPassword) {
        throw httpError(400, "New password must be different from the current password");
    }

    const key = attemptKey(req, `password:${req.user._id}`);
    if (isBlocked(key)) {
        throw httpError(429, "Too many attempts. Please wait 60 seconds before trying again.");
    }

    const account = await userModel.findOne({ _id: req.user._id, origin: req.origin });
    if (!account) throw httpError(401, "Unauthorized");

    let verified = false;
    try {
        verified = await account.verifyPassword(currentPassword);
    } catch {
        verified = false;
    }
    if (!verified) {
        recordFailure(key);
        throw httpError(400, "Current password is incorrect");
    }

    failedLogins.delete(key);
    await account.setPassword(newPassword);
    return res.json({ status: "success", message: "Password updated successfully. Session preserved." });
});

const router = Router();

// `/auth` and `/me` expose the same operations (see openapi.yml).
for (const path of ["/api/v1/auth", "/api/v1/me"]) {
    router.route(path)
        .get(isAuthenticated, status)
        .post(isAuthenticated, changePassword)
        .put(login)
        .patch(isAuthenticated, updateProfile)
        .delete(logout);
}

export default router;
