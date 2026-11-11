// Add to an existing Service Worker, or host as a new worker if none exists.
// If your worker already handles push or notificationclick, merge the handlers instead.
self.addEventListener('push', event => {
  let payload = {};
  if (event.data) {
    try { payload = event.data.json(); }
    catch { payload = { body: event.data.text() }; }
  }
  if (!payload || typeof payload !== 'object') payload = {};
  event.waitUntil(self.registration.showNotification(payload.title || 'Notification', {
    body: payload.body || '',
    tag: payload.tag || 'soochak-push',
    data: { url: payload.url || '/' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || '/', self.location.origin);
  if (destination.origin !== self.location.origin) return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === destination.origin) {
        await client.focus();
        if ('navigate' in client && client.url !== destination.href) await client.navigate(destination.href);
        return;
      }
    }
    await self.clients.openWindow(destination.href);
  })());
});
