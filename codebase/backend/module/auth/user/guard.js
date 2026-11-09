import jwt from "jsonwebtoken";
import userModel from "./model.js";

const unauthorized = (res) => res.status(401).json({
    status: "error",
    message: "Unauthorized"
});

const extractToken = (req) => {
    const credential = req.cookies?.authorization ?? req.get("authorization");
    if (typeof credential !== "string") return null;

    const parts = credential.trim().split(/\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer" || !parts[1]) {
        return null;
    }

    return parts[1];
};

async function isAuthenticated(req, res, next) {
    const token = extractToken(req);
    if (!token) return unauthorized(res);

    let user;
    try {
        user = jwt.verify(token, process.env.JWT_SECRET ?? "");
    } catch (error) {
        return unauthorized(res);
    }

    if (!user || typeof user !== "object" || !user._id || !req.origin) {
        return unauthorized(res);
    }

    if (user.origin !== req.origin) {
        return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    const userDetails = await userModel.findOne({ _id: user._id, origin: req.origin });
    if (!userDetails) return unauthorized(res);

    req.user = userDetails;
    return next();
}


export default isAuthenticated;
