import { Token } from "express-web-tools";
import userController from "./controller.js";

async function isAuthenticated(req, res, next) {
    const authtoken = req.cookies.authorization ?? req.headers.authorization  ;

    if (!authtoken) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized [No Token Found]"
        })
    }
    const token = authtoken.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized- [Invalid Token]"
        })
    }
    try {
        let user = Token.verify(token);
        if (!user || !user._id || !req.origin) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized--[Token Mismatched]",
                info: [
                    !user,
                    !user._id,
                    !req.origin
                ],
                user
            })
        }

        if (user.origin !== req.origin) {
            return res.status(403).json({
                status: "error",
                message: "Forbidden"
            })
        }

        userController.request = req;
        const users = await userController.list({ _id: user._id });
        const userDetails = users[0];
        if (!userDetails) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized"
            });
        }

        req.user = userDetails;
        return next();
    } catch (error) {
        console.log(error);

        return res.status(401).json({
            status: "error",
            message: "token expired"
        })
    }
}


export default isAuthenticated;
