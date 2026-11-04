import permissionModel from "../permission/model.js";

// Grants live in Permission as { authorization: "role:<name>" | "user:<username>", resource, action[] }.
// `<verb>:all` also satisfies the narrower `<verb>:organization` and `<verb>:own`.
const satisfies = (granted, required) => {
    if (granted.includes(required)) return true;
    const [verb, scope] = required.split(":");
    return scope !== "all" && granted.includes(`${verb}:all`);
};

// Run after isAuthenticated so req.user and req.origin are set.
export const authorize = (resource, action) => async (req, res, next) => {
    try {
        const subjects = [`role:${req.user?.role}`, `user:${req.user?.user}`];
        const grants = await permissionModel
            .find({ origin: req.origin, resource, authorization: { $in: subjects } })
            .lean();
        const allowed = grants.some((grant) => satisfies(grant.action ?? [], action));
        if (!allowed) {
            return res.status(403).json({ status: "error", message: "Forbidden" });
        }
        return next();
    } catch (error) {
        return next(error);
    }
};
