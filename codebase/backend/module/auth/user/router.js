import { CrudRoutes } from "express-web-tools";
import userController from "./controller.js";
import isAuthenticated from "./guard.js";
import { authorize } from "./authorize.js";

// Login, logout and /me are special routes in ../session/router.js; this file is the user CRUD.
const RESOURCE = "auth:user";
const FILTER_FIELDS = ["_id", "user", "email", "role", "sex", "phone", "timezone", "name.first", "name.last"];

const notSupported = (req, res) => res.status(405).json({
    status: "error",
    message: "Method not allowed"
});

const userCreationNotSupported = (req, res) => res.status(405).json({
    status: "error",
    message: "Additional user accounts are not supported in a personal workspace"
});

// POST / passes the body to Mongo as a filter. Restrict it to plain equality on public
// fields so it cannot use operators or probe hidden fields such as password or dob.
const validateFilter = (req, res, next) => {
    const body = req.body ?? {};
    const valid = body !== null && typeof body === "object" && !Array.isArray(body) &&
        Object.entries(body).every(([key, value]) =>
            FILTER_FIELDS.includes(key) && ["string", "number", "boolean"].includes(typeof value));
    if (!valid) {
        return res.status(400).json({
            status: "error",
            message: `Filter must use only these fields with plain values: ${FILTER_FIELDS.join(", ")}`
        });
    }
    return next();
};

const userRoutes = new CrudRoutes(
    "/api/v1/auth/user",
    userController,
    {
        listAll: [isAuthenticated, authorize(RESOURCE, "view:all")],
        list: [isAuthenticated, authorize(RESOURCE, "view:all"), validateFilter],
        // The signed-in owner is the only user in a hostname-scoped personal workspace.
        add: [isAuthenticated, userCreationNotSupported],
        read: [isAuthenticated, authorize(RESOURCE, "view:all")],
        update: [isAuthenticated, authorize(RESOURCE, "edit:all")],
        delete: [isAuthenticated, authorize(RESOURCE, "delete:all")],
        // Users have no meaningful order, so reordering is rejected explicitly.
        order: [isAuthenticated, notSupported]
    }
);

export default userRoutes.publish();