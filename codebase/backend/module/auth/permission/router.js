import { CrudRoutes } from "express-web-tools";
import permissionController from "./controller.js";
import isAuthenticated from "../user/guard.js";
import { authorize } from "../user/authorize.js";

const RESOURCE = "auth:permission";
const FILTER_FIELDS = ["authorization", "resource"];
const ACTION_PATTERN = /^(view|edit|delete|import|export):(own|organization|all)$|^(activate|deactivate|reSort)$/;

const notSupported = (req, res) => res.status(405).json({
    status: "error",
    message: "Method not allowed"
});

const validateFilter = (req, res, next) => {
    const body = req.body ?? {};
    const valid = body !== null && typeof body === "object" && !Array.isArray(body) &&
        Object.entries(body).every(([key, value]) =>
            FILTER_FIELDS.includes(key) && typeof value === "string");
    if (!valid) {
        return res.status(400).json({
            status: "error",
            message: `Filter must use only these fields with string values: ${FILTER_FIELDS.join(", ")}`
        });
    }
    return next();
};

const validateBody = (req, res, next) => {
    const body = req.body;
    const allowed = ["authorization", "resource", "action"];
    const valid = body !== null && typeof body === "object" && !Array.isArray(body) &&
        Object.keys(body).length > 0 &&
        Object.keys(body).every((key) => allowed.includes(key)) &&
        (body.authorization === undefined || /^(user|role):[a-zA-Z0-9._-]+$/.test(body.authorization)) &&
        (body.resource === undefined || /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/.test(body.resource)) &&
        (body.action === undefined || (
            Array.isArray(body.action) &&
            body.action.length > 0 &&
            body.action.every((action) => typeof action === "string" && ACTION_PATTERN.test(action))
        ));
    if (!valid) {
        return res.status(400).json({
            status: "error",
            message: "Permission changes must include valid authorization, resource, and action fields"
        });
    }
    return next();
};

const permissionRoutes = new CrudRoutes(
    "/api/v1/auth/permission",
    permissionController,
    {
        listAll: [isAuthenticated, authorize(RESOURCE, "view:organization")],
        list: [isAuthenticated, authorize(RESOURCE, "view:organization"), validateFilter],
        add: [isAuthenticated, authorize(RESOURCE, "edit:organization"), validateBody],
        read: [isAuthenticated, authorize(RESOURCE, "view:organization")],
        update: [isAuthenticated, authorize(RESOURCE, "edit:organization"), validateBody],
        delete: [isAuthenticated, authorize(RESOURCE, "delete:organization")],
        order: [isAuthenticated, notSupported]
    }
);

export default permissionRoutes.publish();