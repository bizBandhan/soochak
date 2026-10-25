/*
 * Soochak prototype push worker.
 *
 * This worker handles push display and notification clicks only. It does not
 * intercept fetches or take over clients. Integrations on sites with an
 * existing Service Worker should merge these event handlers into that worker
 * instead of registering a second worker blindly.
 */

const DEFAULT_TITLE = "Soochak notification";

self.addEventListener("push", (event) => {
    const payload = readPayload(event.data);
    const title = nonEmptyString(payload.title) ?? DEFAULT_TITLE;
    const body = nonEmptyString(payload.body)
        ?? nonEmptyString(payload.message)
        ?? (typeof payload.text === "string" ? payload.text : "");

    const options = {
        body,
        data: {
            url: safeHttpUrl(payload.url ?? payload.data?.url ?? payload.data?.clickUrl),
        },
    };

    for (const key of ["icon", "image", "badge"]) {
        const url = safeHttpUrl(payload[key]);
        if (url) options[key] = url;
    }

    const tag = nonEmptyString(payload.tag);
    if (tag) options.tag = tag;

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const targetUrl = safeHttpUrl(event.notification.data?.url);
    if (!targetUrl) return;

    event.waitUntil((async () => {
        const windows = await self.clients.matchAll({
            type: "window",
            includeUncontrolled: true,
        });

        for (const client of windows) {
            if (client.url === targetUrl) return client.focus();
        }

        const sameOriginWindow = windows.find((client) => {
            try {
                return new URL(client.url).origin === self.location.origin;
            } catch {
                return false;
            }
        });

        if (sameOriginWindow?.navigate) {
            await sameOriginWindow.navigate(targetUrl);
            return sameOriginWindow.focus();
        }

        return self.clients.openWindow(targetUrl);
    })());
});

function readPayload(data) {
    if (!data) return {};

    try {
        const value = data.json();
        if (value && typeof value === "object" && !Array.isArray(value)) return value;
        if (typeof value === "string") return { body: value };
        return {};
    } catch {
        return { body: data.text() };
    }
}

function nonEmptyString(value) {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
}

function safeHttpUrl(value) {
    if (typeof value !== "string" || !value.trim()) return undefined;

    try {
        const url = new URL(value, self.location.origin);
        if ((url.protocol === "https:" || url.protocol === "http:")
            && !url.username
            && !url.password) {
            return url.href;
        }
    } catch {
        // Invalid URLs are omitted from notification options and click data.
    }

    return undefined;
}
