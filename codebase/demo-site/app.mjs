import { registerDemoWorker } from './worker-registration.mjs';

const byId = (id) => document.getElementById(id);
const registerButton = byId('register-worker');
const subscribeButton = byId('subscribe');
const unsubscribeButton = byId('unsubscribe');
const message = byId('message');
let client;
let busy = false;

byId('origin').textContent = window.location.origin;

function showMessage(text, error = false) {
  message.textContent = text;
  message.classList.toggle('error', error);
}

function supported() {
  return window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

async function refresh() {
  byId('secure-status').textContent = window.isSecureContext ? 'Yes' : 'No: use HTTPS';
  byId('client-status').textContent = client ? 'Loaded' : 'Missing or invalid; upload the downloaded client';
  byId('permission-status').textContent = 'Notification' in window ? Notification.permission : 'Not supported';
  if (!supported()) {
    byId('worker-status').textContent = 'Unavailable';
    byId('subscription-status').textContent = 'Unavailable';
    registerButton.disabled = true;
    subscribeButton.disabled = true;
    unsubscribeButton.disabled = true;
    return;
  }
  const worker = await navigator.serviceWorker.getRegistration();
  byId('worker-status').textContent = worker ? `Registered (${worker.scope})` : 'Not registered';
  const subscription = worker ? await worker.pushManager.getSubscription() : null;
  byId('subscription-status').textContent = subscription ? 'Subscribed in browser (workspace not verified)' : 'Not subscribed';
  registerButton.disabled = busy;
  subscribeButton.disabled = busy || !client || !worker;
  unsubscribeButton.disabled = busy || !client || !worker;
}

async function loadClient() {
  try {
    const module = await import('./soochak-client.js');
    if (typeof module.subscribeSoochak !== 'function' || typeof module.unsubscribeSoochak !== 'function') {
      throw new Error('The integration client is missing required exports.');
    }
    client = module;
    showMessage('Integration client loaded. Register or integrate your Service Worker before subscribing.');
  } catch (error) {
    showMessage(`Could not load soochak-client.js: ${error.message}. Download it from your workspace and upload it beside this page.`, true);
  }
  await refresh();
}

async function run(action, success) {
  if (busy) return;
  busy = true;
  try {
    const operation = action();
    await Promise.all([operation, refresh()]);
    showMessage(success);
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'The operation failed.', true);
  } finally {
    busy = false;
    try { await refresh(); } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to refresh browser status.', true);
    }
  }
}

registerButton.addEventListener('click', () => {
  void run(async () => {
    const workerUrl = new URL('./soochak-worker.js', window.location.href);
    const response = await fetch(workerUrl, { cache: 'no-store' });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !/(javascript|ecmascript)/i.test(contentType)) {
      throw new Error('soochak-worker.js is missing or not served as JavaScript. Upload the downloaded handler beside this page.');
    }
    await registerDemoWorker(navigator.serviceWorker, new URL(window.location.href));
  }, 'Demo worker registered. You can now subscribe.');
});

subscribeButton.addEventListener('click', () => {
  if (!client || busy) return;
  void run(() => client.subscribeSoochak(), 'Subscribed with Soochak. Send a test notification from your workspace.');
});
unsubscribeButton.addEventListener('click', () => {
  if (client) void run(() => client.unsubscribeSoochak(), 'Unsubscribed from Soochak and this browser.');
});
byId('refresh').addEventListener('click', () => { void run(refresh, 'Browser status refreshed.'); });

void loadClient().catch((error) => showMessage(error instanceof Error ? error.message : 'Failed to initialize the demo.', true));
