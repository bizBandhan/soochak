import { CrudController, HttpError } from "express-web-tools";
import subscriberModel from "./model.js";

const httpError = (code, message) => Object.assign(new HttpError(code, message), { status: code });

class SubscriberController extends CrudController {
    // Re-registering an endpoint updates its existing record instead of creating a duplicate.
    async create(data) {
        const { endpoint, keys } = data ?? {};

        let url;
        try {
            url = new URL(endpoint);
        } catch {
            throw httpError(400, "A valid subscription endpoint is required");
        }
        if (url.protocol !== "https:") {
            throw httpError(400, "Subscription endpoint must use https");
        }
        if (!keys?.p256dh || !keys?.auth) {
            throw httpError(400, "Subscription keys (p256dh and auth) are required");
        }

        const existing = await this.findOne({ endpoint });
        if (existing) {
            return this.update(existing._id, data);
        }
        return super.create(data);
    }
}

export default new SubscriberController(subscriberModel);