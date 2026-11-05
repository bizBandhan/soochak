const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const RESERVED_LABELS = new Set(["admin", "api", "cdn", "mgmt", "soochak", "static", "www"]);

export function normalizeHostedDomain(domain) {
    if (typeof domain !== "string") {
        throw new Error("HOSTED_DOMAIN must be configured");
    }

    const normalized = domain.trim().toLowerCase();
    const labels = normalized.split(".");
    if (
        normalized.length > 253
        || labels.length < 2
        || labels.some((label) => !HOST_LABEL.test(label))
    ) {
        throw new Error("HOSTED_DOMAIN must be a valid DNS domain without scheme, path, or port");
    }

    return normalized;
}

export function workspaceHostForSlug(slug, hostedDomain) {
    const normalizedSlug = typeof slug === "string" ? slug.trim().toLowerCase() : "";
    if (!HOST_LABEL.test(normalizedSlug)) {
        const error = new Error("Slug must be a valid DNS label using letters, numbers, and hyphens");
        error.status = 400;
        throw error;
    }
    if (RESERVED_LABELS.has(normalizedSlug)) {
        const error = new Error("This slug is reserved and cannot be used as a workspace hostname");
        error.status = 400;
        throw error;
    }

    const domain = normalizeHostedDomain(hostedDomain);
    const hostname = `${normalizedSlug}.${domain}`;
    if (hostname.length > 253) {
        const error = new Error("Slug is too long to form a valid workspace hostname");
        error.status = 400;
        throw error;
    }

    return hostname;
}
