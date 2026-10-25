import { Router } from "express";
import subscriberRouter from "./web-push/subscriber/routes.js";
import noteRouter from "./web-push/notify/router.js";
const router = Router();
const vapid = {
    "publicKey": "BHia8cQUT1hGZIwnz0UmpprftYGekEgp4hEtekrJhega-2ReT5jml27nI-0bbIFlkwuwj1P1mAYUw3LanNBuGv0",
    "privateKey": "84_Lbw_M1R6PsaW3O1VjEvqmtH5lot4i9LU14V4kwG0"
}

router.use((req, res, next) => {
    if (!req.user) req.user = {};
    req.vapid=vapid
    next();
})
router
    .use(
        "/api/v1/web-push/subscriber",
        subscriberRouter
    )
    .use(
        "/api/v1/web-push/notify",
        noteRouter
    )
router
    .get(
        "/api/v1/web-push/config",
        (req, res) => {
            return res.json({
                status: "success",
                message: "",
                data: vapid.publicKey
            })
        }
    )

export default router;