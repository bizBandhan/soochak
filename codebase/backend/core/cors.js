import cors from "cors";
import siteModel from "../module/web-push/site/model.js";

export function isRequestOrigin(origin, req) {
    try {
        const parsed = new URL(origin);
        return parsed.origin === origin && parsed.protocol === "https:"
            && parsed.host.toLowerCase() === req.get("host")?.toLowerCase();
    } catch {
        return false;
    }
}

function isPublicPushRequest(req) {
    const method = req.method === "OPTIONS" ? req.get("access-control-request-method") : req.method;
    return (method === "GET" && /^\/api\/v1\/web-push\/config\/?$/.test(req.path))
        || (method === "PUT" && /^\/api\/v1\/web-push\/subscriber\/?$/.test(req.path))
        || (method === "DELETE" && /^\/api\/v1\/web-push\/subscriber\/[a-fA-F0-9]{24}\/?$/.test(req.path));
}

const corsHandler = cors((req, callback) => {
    const origin = req.get("origin");
    if (!origin) return callback(null, { origin: false });
    if (isRequestOrigin(origin, req)) {
        return callback(null, { origin, credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] });
    }
    if (!isPublicPushRequest(req)) return callback(null, { origin: false });
    siteModel.exists({ workspace: req.get("host"), origin })
        .then((site) => callback(null, {
            origin: site ? origin : false,
            credentials: false,
            methods: ["GET", "PUT", "DELETE"],
            allowedHeaders: ["Content-Type"]
        }))
        .catch(callback);
});

export function corsMiddleware(req, res, next) {
    res.vary("Origin");
    corsHandler(req, res, next);
}

export async function protectPublicPushOrigins(req, res, next) {
    const origin = req.get("origin");
    if (!origin || isRequestOrigin(origin, req) || !isPublicPushRequest(req)) return next();
    try {
        if (await siteModel.exists({ workspace: req.get("host"), origin })) return next();
        return res.status(403).json({ status: "error", message: "Website origin is not allowed for this workspace" });
    } catch (error) {
        return next(error);
    }
}
