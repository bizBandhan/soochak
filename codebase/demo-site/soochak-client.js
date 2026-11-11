// Soochak browser integration. Import this module and call subscribeSoochak()
// from a user gesture after registering your own Service Worker.
const api = "https://biz-bandhan.bizbandhan.duckdns.org/api/v1/web-push/subscriber";
const publicKey = "BMT9unqsh0w4kAHAYvxTif3TGSzP_h0D-iZgzInsONiO1deNJH8wTXvmY-Q_42DQUP2OpFgy1nSc9b7eElWdwaU";
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
