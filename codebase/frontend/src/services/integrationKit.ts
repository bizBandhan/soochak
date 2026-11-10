export function createClientScript(apiOrigin: string, publicKey: string): string {
  return `// Soochak browser integration. Import this module and call subscribeSoochak()
// from a user gesture after registering your own Service Worker.
const api = ${JSON.stringify(`${apiOrigin}/api/v1/web-push/subscriber`)};
const publicKey = ${JSON.stringify(publicKey)};
const storageKey = 'soochak-subscriber:' + api;

function applicationKey(value) {
  const padded = (value + '='.repeat((4 - value.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

async function registration() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('Web Push is not supported in this browser.');
  }
  const worker = await navigator.serviceWorker.getRegistration();
  if (!worker) throw new Error('Register your Service Worker before subscribing.');
  return worker;
}

async function callApi(url, options) {
  const response = await fetch(url, { ...options, credentials: 'omit' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Soochak request failed.');
  return result;
}

function checkKey(subscription, expectedKey) {
  const actualKey = subscription.options.applicationServerKey;
  if (!actualKey || new Uint8Array(actualKey).length !== expectedKey.length ||
      !new Uint8Array(actualKey).every((value, i) => value === expectedKey[i])) {
    throw new Error('The existing push subscription uses another application key. Do not replace it automatically.');
  }
}

export async function subscribeSoochak() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('Web Push is not supported in this browser.');
  }
  if (await Notification.requestPermission() !== 'granted') throw new Error('Notification permission was not granted.');
  const worker = await registration();
  let subscription = await worker.pushManager.getSubscription();
  const expectedKey = applicationKey(publicKey);
  if (subscription) {
    checkKey(subscription, expectedKey);
  } else {
    subscription = await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: expectedKey });
  }
  const result = await callApi(api, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON())
  });
  if (!result.data?._id) throw new Error('Soochak did not return a subscriber ID.');
  localStorage.setItem(storageKey, result.data._id);
  return result.data;
}

export async function unsubscribeSoochak() {
  const worker = await registration();
  const subscription = await worker.pushManager.getSubscription();
  const id = localStorage.getItem(storageKey);
  if (!id) throw new Error('No Soochak subscriber ID is stored on this device.');
  if (subscription) checkKey(subscription, applicationKey(publicKey));
  const response = await fetch(api + '/' + encodeURIComponent(id), { method: 'DELETE', credentials: 'omit' });
  if (!response.ok && response.status !== 404) {
    const result = await response.json();
    throw new Error(result.message || 'Soochak unsubscribe failed.');
  }
  if (subscription && !(await subscription.unsubscribe())) throw new Error('Browser unsubscribe failed.');
  localStorage.removeItem(storageKey);
}
`;
}

export const workerScript = `// Add to an existing Service Worker, or host as a new worker if none exists.
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
`;

export function downloadScript(filename: string, script: string): void {
  const url = URL.createObjectURL(new Blob([script], { type: 'text/javascript;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
