import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { createClientScript, workerScript } from './integrationKit';

test('downloaded client subscribes and unsubscribes without replacing the worker', async () => {
  const key = Buffer.from([1, 2, 3, 4]);
  const script = createClientScript('https://workspace.example', key.toString('base64url'));
  const client = await import(`data:text/javascript;base64,${Buffer.from(script).toString('base64')}`);
  const stored = new Map<string, string>();
  const requests: { url: string; options: RequestInit }[] = [];
  let rejectRequest = false;
  let subscription: { options: { applicationServerKey: Uint8Array }; toJSON: () => object; unsubscribe: () => Promise<boolean> } | null = null;
  let unsubscribeCount = 0;
  const worker = {
    pushManager: {
      getSubscription: async () => subscription,
      subscribe: async ({ applicationServerKey }: { applicationServerKey: Uint8Array }) => {
        subscription = {
          options: { applicationServerKey },
          toJSON: () => ({ endpoint: 'https://push.example/endpoint', keys: { p256dh: 'public', auth: 'auth' } }),
          unsubscribe: async () => { unsubscribeCount++; subscription = null; return true; },
        };
        return subscription;
      },
    },
  };
  const original = {
    navigator: globalThis.navigator, window: globalThis.window, Notification: globalThis.Notification,
    localStorage: globalThis.localStorage, fetch: globalThis.fetch,
  };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { serviceWorker: { getRegistration: async () => worker } } });
  Object.assign(globalThis, {
    window: { PushManager: class {}, Notification: {} },
    Notification: { requestPermission: async () => 'granted' },
    localStorage: {
      getItem: (name: string) => stored.get(name) ?? null,
      setItem: (name: string, value: string) => stored.set(name, value),
      removeItem: (name: string) => stored.delete(name),
    },
    fetch: async (url: string, options: RequestInit) => {
      requests.push({ url, options });
      if (rejectRequest) return { ok: false, status: 429, json: async () => ({ message: 'Quota reached' }) };
      return { ok: true, status: 200, json: async () => ({ data: { _id: 'abc' } }) };
    },
  });
  try {
    await client.subscribeSoochak();
    await client.subscribeSoochak();
    assert.equal(requests[0].url, 'https://workspace.example/api/v1/web-push/subscriber');
    assert.equal(requests[0].options.credentials, 'omit');
    assert.equal(requests[0].options.method, 'PUT');
    assert.equal(stored.size, 1);
    const activeSubscription = await worker.pushManager.getSubscription();
    assert.ok(activeSubscription);
    activeSubscription.options.applicationServerKey = new Uint8Array([9]);
    await assert.rejects(client.subscribeSoochak(), /another application key/);
    await assert.rejects(client.unsubscribeSoochak(), /another application key/);
    assert.equal(unsubscribeCount, 0);
    activeSubscription.options.applicationServerKey = key;
    rejectRequest = true;
    await assert.rejects(client.unsubscribeSoochak(), /Quota reached/);
    assert.equal(unsubscribeCount, 0);
    assert.equal(stored.size, 1);
    rejectRequest = false;
    await client.unsubscribeSoochak();
    assert.equal(requests[3].url, 'https://workspace.example/api/v1/web-push/subscriber/abc');
    assert.equal(requests[3].options.method, 'DELETE');
    assert.equal(requests[3].options.credentials, 'omit');
    assert.equal(unsubscribeCount, 1);
    assert.equal(stored.size, 0);
    await assert.rejects(client.unsubscribeSoochak(), /subscriber ID/);
  } finally {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: original.navigator });
    Object.assign(globalThis, { window: original.window, Notification: original.Notification, localStorage: original.localStorage, fetch: original.fetch });
  }
});

test('worker handles push and rejects cross-origin notification clicks', async () => {
  const handlers: Record<string, (event: any) => void> = {};
  const shown: unknown[] = [];
  let opened = '';
  const self = {
    location: { origin: 'https://site.example' },
    addEventListener: (name: string, handler: (event: any) => void) => { handlers[name] = handler; },
    registration: { showNotification: async (...args: unknown[]) => { shown.push(args); } },
    clients: { matchAll: async () => [], openWindow: async (url: string) => { opened = url; } },
  };
  vm.runInNewContext(workerScript, { self, URL });
  let pending: Promise<unknown> | undefined;
  handlers.push({ data: { json: () => ({ title: 'Hello', url: '/news' }) }, waitUntil: (p: Promise<unknown>) => { pending = p; } });
  await pending;
  assert.equal((shown[0] as unknown[])[0], 'Hello');
  handlers.notificationclick({ notification: { close() {}, data: { url: 'https://evil.example' } }, waitUntil: (p: Promise<unknown>) => { pending = p; } });
  assert.equal(opened, '');
  handlers.notificationclick({ notification: { close() {}, data: { url: '/news' } }, waitUntil: (p: Promise<unknown>) => { pending = p; } });
  await pending;
  assert.equal(opened, 'https://site.example/news');
});
