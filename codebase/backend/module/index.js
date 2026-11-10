import { Router } from "express";
import subscriberRouter from "./web-push/subscriber/routes.js";
import noteRouter from "./web-push/notify/router.js";
import organizationRouter from "./auth/organization/router.js";
import sessionRouter from "./auth/session/router.js";
import userRouter from "./auth/user/router.js";
import roleRouter from "./auth/role/router.js";
import permissionRouter from "./auth/permission/router.js";
import { ensureWorkspaceVapidKeys } from "./web-push/vapid.js";
import siteRouter from "./web-push/site/router.js";
const router = Router();

router.use((req, res, next) => {
    if (!req.user) req.user = {};
    next();
})
router
    .use(sessionRouter)
    .use(organizationRouter)
    .use(userRouter)
    .use(roleRouter)
    .use(permissionRouter)
    .use("/api/v1/web-push/site", siteRouter)
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
        async (req, res) => {
            const publicKey = await ensureWorkspaceVapidKeys(req.origin);
            return res.json({
                status: "success",
                message: "",
                data: publicKey
            })
        }
    )

export default router;
