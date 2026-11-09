import permissionModel from "../permission/model.js";

const SCOPE_LEVEL = { own: 0, organization: 1, all: 2 };

// Grants combine additively across the current user's direct and role principals.
const satisfies = (grants, required) => {
    const [verb, scope, ...rest] = required.split(":");
    if (!verb || rest.length) return grants.includes(required);
    const requiredLevel = Object.hasOwn(SCOPE_LEVEL, scope) ? SCOPE_LEVEL[scope] : undefined;
    if (requiredLevel === undefined) return grants.includes(required);

    return grants.some((grant) => {
        if (typeof grant !== "string") return false;
        const [grantedVerb, grantedScope, ...grantedRest] = grant.split(":");
        return grantedVerb === verb
            && grantedRest.length === 0
            && Object.hasOwn(SCOPE_LEVEL, grantedScope)
            && SCOPE_LEVEL[grantedScope] >= requiredLevel;
    });
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
