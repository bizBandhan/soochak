import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

test('retires the development worker after taking control', async () => {
  const calls = [];
  const listeners = {};
  const self = {
    addEventListener: (type, listener) => { listeners[type] = listener; },
    skipWaiting: async () => { calls.push('skipWaiting'); },
    clients: { claim: async () => { calls.push('claim'); } },
    registration: { unregister: async () => { calls.push('unregister'); } },
  };
  const source = await readFile(new URL('./dev-sw-migration.js', import.meta.url), 'utf8');
  runInNewContext(source, { self });

  let pending;
  listeners.install({ waitUntil: (promise) => { pending = promise; } });
  await pending;
  listeners.activate({ waitUntil: (promise) => { pending = promise; } });
  await pending;

  assert.deepEqual(calls, ['skipWaiting', 'claim', 'unregister']);
});
