import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerDemoWorker } from './worker-registration.mjs';

const page = new URL('https://demo.example/test/index.html');
const scope = 'https://demo.example/test/';
const script = `${scope}soochak-worker.js`;

function serviceWorker(registrations) {
  const calls = [];
  return {
    calls,
    getRegistrations: async () => registrations,
    register: async (url, options) => {
      calls.push({ url, options });
      return { scope, active: { scriptURL: url } };
    },
  };
}

test('registers the demo worker at the page directory scope', async () => {
  const api = serviceWorker([]);
  await registerDemoWorker(api, page);
  assert.deepEqual(api.calls, [{ url: script, options: { scope: '/test/' } }]);
});

test('reuses the existing demo worker without registering again', async () => {
  const existing = { scope, active: { scriptURL: script } };
  const api = serviceWorker([existing]);
  assert.equal(await registerDemoWorker(api, page), existing);
  assert.equal(api.calls.length, 0);
});

test('does not replace another worker covering the page or scope', async () => {
  for (const existing of [
    { scope, active: { scriptURL: 'https://demo.example/test/existing.js' } },
    { scope: 'https://demo.example/', active: { scriptURL: 'https://demo.example/sw.js' } },
    { scope, active: null },
  ]) {
    const api = serviceWorker([existing]);
    await assert.rejects(registerDemoWorker(api, page), /will not be replaced/);
    assert.equal(api.calls.length, 0);
  }
});
