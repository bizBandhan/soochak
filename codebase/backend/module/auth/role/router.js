import { CrudRoutes } from "express-web-tools";
import roleController from "./controller.js";
import isAuthenticated from "../user/guard.js";
import { authorize } from "../user/authorize.js";

const RESOURCE = "auth:role";
const FILTER_FIELDS = ["name", "description"];

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
    const allowed = ["name", "description"];
    const valid = body !== null && typeof body === "object" && !Array.isArray(body) &&
        Object.keys(body).length > 0 &&
        Object.keys(body).every((key) => allowed.includes(key)) &&
        (body.name === undefined || (typeof body.name === "string" && body.name.trim().length > 0)) &&
        (body.description === undefined || typeof body.description === "string");
    if (!valid) {
        return res.status(400).json({
            status: "error",
            message: "Role changes may include a non-empty name and/or description"
        });
    }
    if (body.name?.trim().toLowerCase() === "owner") {
        return res.status(400).json({ status: "error", message: "The owner role is reserved" });
    }
    return next();
};

const roleRoutes = new CrudRoutes(
    "/api/v1/auth/role",
    roleController,
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

export default roleRoutes.publish();