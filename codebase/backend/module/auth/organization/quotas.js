import { HttpError } from "express-web-tools";
import organizationModel from "./model.js";

const httpError = (status, message) => Object.assign(new HttpError(status, message), { status });

export async function planLimitFor(origin, key) {
    const organization = await organizationModel.findOne({ origin });
    const limit = organization?.limits?.[key];
    if (!Number.isSafeInteger(limit) || limit < 0) {
        throw httpError(503, "Workspace plan limits are unavailable");
    }
    return limit;
}

export async function assertDailyNotificationCapacity(origin, usedToday) {
    const limit = await planLimitFor(origin, "maxNotificationsPerDay");
    if (usedToday >= limit) {
        throw httpError(429, "The daily notification limit for this plan has been reached");
    }
    return limit;
}
