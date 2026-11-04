import { HttpError } from "express-web-tools";

const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

export const MIN_PASSWORD_LENGTH = 8;

// errorRoute reads `status`, while HttpError only exposes `code`.
export const httpError = (code, message) => Object.assign(new HttpError(code, message), { status: code });

export const isValidTimezone = (timezone) => {
    try {
        new Intl.DateTimeFormat("en", { timeZone: timezone });
        return true;
    } catch {
        return false;
    }
};

export const capitalize = (value) => typeof value === "string" && value
    ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    : value;

// Returns an E.164 number, or undefined for a blank value; throws 400 for anything else.
export const normalizePhone = (value) => {
    if (value === undefined || value === null || String(value).trim() === "") return undefined;
    const phone = String(value).replace(/[\s()-]/g, "");
    if (!E164_PATTERN.test(phone)) {
        throw httpError(400, "Phone number must be in international format, e.g. +919876543210");
    }
    return phone;
};

export const assertTimezone = (timezone) => {
    if (!isValidTimezone(timezone)) {
        throw httpError(400, "Timezone must be a valid IANA timezone, e.g. Asia/Kolkata");
    }
};

const NAME_FIELDS = ["salutation", "first", "middle", "last"];
const SEX_VALUES = ["Male", "Female", "Other"];

// Validates a partial profile body against an allow-list. Returns the `$set`-style paths to
// assign and the paths to clear; anything outside `allowed` is rejected rather than ignored.
export const buildProfileUpdate = (body, allowed) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw httpError(400, "Request body must be a JSON object");
    }
    const keys = Object.keys(body);
    if (!keys.length) throw httpError(400, "Provide at least one field to update");
    const unknown = keys.filter((key) => !allowed.includes(key));
    if (unknown.length) throw httpError(400, `Fields cannot be updated: ${unknown.join(", ")}`);

    const update = {};
    const unset = {};

    if ("name" in body) {
        if (!body.name || typeof body.name !== "object" || Array.isArray(body.name)) {
            throw httpError(400, "Name must be an object");
        }
        for (const [key, value] of Object.entries(body.name)) {
            if (!NAME_FIELDS.includes(key)) throw httpError(400, `Unknown name field: ${key}`);
            if (typeof value !== "string") throw httpError(400, `Name ${key} must be text`);
            const trimmed = value.trim();
            if (["first", "last"].includes(key) && !trimmed) throw httpError(400, `${key === "first" ? "First" : "Last"} name is required`);
            if (trimmed) update[`name.${key}`] = trimmed;
            else unset[`name.${key}`] = "";
        }
    }
    if ("email" in body) {
        if (typeof body.email !== "string" || !body.email.trim()) throw httpError(400, "E-Mail id is required");
        update.email = body.email.trim();
    }
    if ("sex" in body) {
        const sex = capitalize(body.sex);
        if (!SEX_VALUES.includes(sex)) throw httpError(400, "Sex must be Male, Female or Other");
        update.sex = sex;
    }
    if ("dob" in body) {
        if (typeof body.dob !== "string" || Number.isNaN(Date.parse(body.dob))) {
            throw httpError(400, "Date of birth must be a valid date");
        }
        update.dob = body.dob;
    }
    if ("phone" in body) {
        const phone = normalizePhone(body.phone);
        if (phone === undefined) unset.phone = "";
        else update.phone = phone;
    }
    if ("timezone" in body) {
        if (typeof body.timezone !== "string" || !body.timezone.trim()) {
            unset.timezone = "";
        } else {
            assertTimezone(body.timezone.trim());
            update.timezone = body.timezone.trim();
        }
    }
    if ("profilePicture" in body) {
        const picture = body.profilePicture;
        if (picture === null || picture === "") {
            unset.profilePicture = "";
        } else {
            if (typeof picture !== "string" || picture.length > 2048 || !/^https?:\/\//i.test(picture)) {
                throw httpError(400, "Profile picture must be an http(s) URL");
            }
            update.profilePicture = picture;
        }
    }
    return { update, unset };
};

// Applies a buildProfileUpdate result to a document and saves it, so schema validators run.
export const saveProfileUpdate = async (account, { update, unset }) => {
    for (const [path, value] of Object.entries(update)) account.set(path, value);
    for (const path of Object.keys(unset)) account.set(path, undefined);
    try {
        await account.save();
    } catch (error) {
        if (error.name === "ValidationError") {
            throw httpError(400, Object.values(error.errors).map((e) => e.message).join("; "));
        }
        throw error;
    }
    return account;
};
