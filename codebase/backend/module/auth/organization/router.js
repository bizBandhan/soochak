import { CrudRoutes } from "express-web-tools";
import organizationController from "./controller.js";
import isAuthenticated from "../user/guard.js";
import { authorize } from "../user/authorize.js";

const notSupported = (req, res) => res.status(405).json({
    status: "error",
    message: "Method not allowed"
});

const organizationRoutes = new CrudRoutes(
    "/api/v1/auth/organization",
    organizationController,
    {
        listAll: [isAuthenticated, authorize("auth:organization", "view:organization")],
        list: [isAuthenticated, authorize("auth:organization", "view:organization")],
        read: [isAuthenticated, authorize("auth:organization", "view:organization")],
        update: [isAuthenticated, authorize("auth:organization", "edit:organization")],
        delete: [isAuthenticated, authorize("auth:organization", "delete:organization")],
        // CrudRoutes publishes PATCH /:id for reordering. This resource does
        // not support reordering, so keep the method explicit and reject it.
        order: [notSupported]
    }
);

export default organizationRoutes.publish();
