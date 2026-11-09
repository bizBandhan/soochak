import { normalizeHostedDomain } from "../module/auth/organization/hostname.js";

const REQUIRED_KEYS = ["PORT", "DB", "JWT_SECRET", "HOSTED_DOMAIN"];

export function loadConfig(env = process.env) {
    const missing = REQUIRED_KEYS.filter((key) => typeof env[key] !== "string" || !env[key].trim());
    if (missing.length) {
        throw new Error(`Missing required configuration: ${missing.join(", ")}`);
    }

    const port = Number(env.PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer between 1 and 65535");
    }

    if (
        env.JWT_SECRET.length < 32
        || env.JWT_SECRET === "replace-this-with-a-random-secret-of-at-least-32-characters"
    ) {
        throw new Error("JWT_SECRET must be a non-example secret of at least 32 characters");
    }

    let databaseUrl;
    try {
        databaseUrl = new URL(env.DB);
    } catch {
        throw new Error("DB must be a valid MongoDB connection URL");
    }
    if (!["mongodb:", "mongodb+srv:"].includes(databaseUrl.protocol)) {
        throw new Error("DB must use the mongodb or mongodb+srv scheme");
    }

    let hostedDomain;
    try {
        hostedDomain = normalizeHostedDomain(env.HOSTED_DOMAIN);
    } catch (error) {
        throw new Error(`Invalid HOSTED_DOMAIN: ${error.message}`);
    }

    return {
        port,
        databaseUrl: env.DB,
        jwtSecret: env.JWT_SECRET,
        hostedDomain
    };
}
