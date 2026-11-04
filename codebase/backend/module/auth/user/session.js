import { Token } from "express-web-tools";

export const SESSION_COOKIE = "authorization";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = (req) => ({
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    sameSite: "lax",
    path: "/"
});

// The token goes only into an httpOnly cookie, in the "Bearer <token>" form isAuthenticated expects.
export function startSession(req, res, user) {
    const token = Token.generate({ _id: String(user._id), origin: req.origin }, "7d");
    res.cookie(SESSION_COOKIE, `Bearer ${token}`, { ...cookieOptions(req), maxAge: SESSION_MAX_AGE_MS });
    return new Date(Date.now() + SESSION_MAX_AGE_MS);
}

export function endSession(req, res) {
    res.clearCookie(SESSION_COOKIE, cookieOptions(req));
}
