import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/api/v1/health/live", (req, res) => {
    res.json({ status: "ok" });
});

router.get("/api/v1/health/ready", (req, res) => {
    const ready = mongoose.connection.readyState === 1;
    return res.status(ready ? 200 : 503).json({
        status: ready ? "ok" : "not-ready"
    });
});

export default router;
