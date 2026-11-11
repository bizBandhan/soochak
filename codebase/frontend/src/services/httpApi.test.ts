import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { HttpApi } from './httpApi';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('preserves server failures instead of returning success-shaped values', async () => {
  const api = new HttpApi('/api/v1');
  globalThis.fetch = async () => new Response(JSON.stringify({ status: 'error', message: 'Not allowed' }), {
    status: 403, headers: { 'Content-Type': 'application/json' },
  });
  await assert.rejects(api.put('/web-push/notify', {}), (error: Error & { status?: number }) =>
    error.message === 'Not allowed' && error.status === 403);
  await assert.rejects(api.delete('/web-push/subscriber/1'), /Not allowed/);
});

test('returns real data and accepts a successful empty logout response', async () => {
  const api = new HttpApi('/api/v1');
  const requests: { url: string; options?: RequestInit }[] = [];
  globalThis.fetch = async (input, options) => {
    requests.push({ url: String(input), options });
    return options?.method === 'DELETE'
      ? new Response(null, { status: 204 })
      : new Response(JSON.stringify({ status: 'success', data: { _id: 'actual' } }));
  };
  assert.deepEqual(await api.get('/resource'), { status: 'success', data: { _id: 'actual' } });
  assert.equal(await api.delete('/auth'), undefined);
  assert.equal(requests[0].url, '/api/v1/resource');
  assert.equal(requests[0].options?.credentials, 'include');
});

test('propagates network and malformed response errors', async () => {
  const api = new HttpApi('/api/v1');
  globalThis.fetch = async () => { throw new Error('Network unavailable'); };
  await assert.rejects(api.put('/web-push/notify', {}), /Network unavailable/);
  globalThis.fetch = async () => new Response('not json', { status: 200 });
  await assert.rejects(api.get('/resource'), /invalid response/);
});
