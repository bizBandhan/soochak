import express from "express";
import mongoose from "mongoose";
import { configTest, fallbackRoute, ExpressServer, eventStream, errorRoute } from "express-web-tools";
import cors from "cors";
import pureIP from "express-pureip";
import cookieParser from "cookie-parser"
import moduleRoutes from "../module/index.js";
(async () => {
    configTest([
        "PORT",
        "DB"
    ])

    await mongoose.connect(process.env.DB);

    let server = new ExpressServer();
    server.addMiddleware([
        express.static("public"),
        express.json(),
        express.urlencoded({ extended: true }),
        cors({
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELTE"],
            origin: (origin, callback) => {
                callback(null, true)
            }
        }),
        cookieParser(),
        pureIP,
        setOrigin,
        moduleRoutes,
        fallbackRoute,
        errorRoute
    ])
    server.start(process.env.PORT || 3000);
})();
eventStream.addListener("error", e => {
    console.error(`[${new Date().toISOString()}]  ${e.message}`);
})
eventStream.addListener("fallback", e => {
    console.error(`[${new Date().toISOString()}]  Fallback route called`);
})
eventStream.addListener("server-started", e => {
    console.log(`[${new Date().toISOString()}]  ${e.message}`);
})

function setOrigin(req, res, next) {
    req.origin = req.host;
    next();
}