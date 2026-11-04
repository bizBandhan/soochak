import { CrudRoutes } from "express-web-tools";
import controller from "./controller.js";
import isAuthenticated from "../../auth/user/guard.js";

const notSupported = (req, res) => res.status(405).json({
    status: "error",
    message: "Method not allowed"
});

// Follows the CRUD method policy. The browser SDK only needs `PUT /` (subscribe) and
// `DELETE /:id` (unsubscribe), so those stay public; everything that reads or changes
// stored subscriptions requires a signed-in dashboard user.
const subscriberRoutes = new CrudRoutes(
    "/",
    controller,
    {
        listAll: [isAuthenticated],
        list: [isAuthenticated],
        read: [isAuthenticated],
        update: [isAuthenticated],
        // Subscribers have no meaningful order.
        order: [notSupported]
    }
);

export default subscriberRoutes.publish();
