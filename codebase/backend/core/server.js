import express from "express";
import mongoose from "mongoose";
import { fallbackRoute, ExpressServer, eventStream, errorRoute } from "express-web-tools";
import cors from "cors";
import pureIP from "express-pureip";
import cookieParser from "cookie-parser"
import moduleRoutes from "../module/index.js";
import healthRoutes from "./health.js";
import { loadConfig } from "./config.js";
(async () => {
    const config = loadConfig();
    await mongoose.connect(config.databaseUrl);

    let server = new ExpressServer();
    server.addMiddleware([
        express.static("public"),
        express.json(),
        express.urlencoded({ extended: true }),
        cors((req, callback) => {
            const origin = req.get("origin");
            callback(null, {
                credentials: true,
                methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
                origin: origin ? isRequestOrigin(origin, req) : false
            });
        }),
        cookieParser(),
        pureIP,
        setOrigin,
        protectCookieRequests,
        healthRoutes,
        moduleRoutes,
        fallbackRoute,
        errorRoute
    ])
    server.start(config.port);
})().catch((error) => {
    console.error(JSON.stringify({
        time: new Date().toISOString(),
        event: "startup-failed",
        error: {
            name: error?.name ?? "Error",
            code: error?.code
        }
    }));
    process.exit(1);
});
eventStream.addListener("error", e => {
    console.error(JSON.stringify({
        time: new Date().toISOString(),
        event: "application-error",
        error: {
            name: e?.name ?? "Error",
            code: e?.code
        }
    }));
})
eventStream.addListener("fallback", e => {
    console.warn(JSON.stringify({
        time: new Date().toISOString(),
        event: "fallback-route"
    }));
})
eventStream.addListener("server-started", e => {
    console.log(JSON.stringify({
        time: new Date().toISOString(),
        event: "server-started",
        port: config.port
    }));
})

function setOrigin(req, res, next) {
    req.origin = req.host;
    next();
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isRequestOrigin(origin, req) {
    try {
        const parsed = new URL(origin);
        const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0].trim();
        const requestProtocol = forwardedProtocol || req.protocol;
        return parsed.origin === origin
            && parsed.host.toLowerCase() === req.get("host")?.toLowerCase()
            && parsed.protocol === `${requestProtocol}:`;
    } catch {
        return false;
    }
}

function protectCookieRequests(req, res, next) {
    if (
        !req.path.startsWith("/api/")
        || !UNSAFE_METHODS.has(req.method)
        || !req.cookies?.authorization
    ) {
        return next();
    }

    const origin = req.get("origin");
    if (!origin || !isRequestOrigin(origin, req)) {
        return res.status(403).json({
            status: "error",
            message: "Cross-origin cookie request rejected"
        });
    }

    return next();
}