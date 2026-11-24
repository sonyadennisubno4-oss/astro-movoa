import test from 'node:test';
import assert from 'node:assert/strict';
import movoaIntegration, { createMovoaClient, MovoaError } from './src/index.js';

test('astro integration registers virtual:movoa vite plugin', () => {
  const integration = movoaIntegration({ defaultModel: 'seedance-2-5' });
  assert.equal(integration.name, 'astro-movoa');
  let captured = null;
  integration.hooks['astro:config:setup']({
    updateConfig(cfg) { captured = cfg; },
    logger: { info() {} },
  });
  const plugin = captured.vite.plugins[0];
  assert.equal(plugin.resolveId('virtual:movoa'), '\0virtual:movoa');
  const code = plugin.load('\0virtual:movoa');
  assert.match(code, /seedance-2-5/);
  assert.match(code, /createMovoaClient/);
});

test('client submits video, polls until success, and reads credits', async () => {
  const calls = [];
  const mockFetch = async (url, init) => {
    calls.push({ url, body: init.body ? JSON.parse(init.body) : undefined });
    if (url.endsWith('/api/user/get-user-credits')) {
      return new Response(JSON.stringify({ code: 0, data: { remainingCredits: 42 } }), { status: 200 });
    }
    if (url.endsWith('/api/ai/generate')) {
      return new Response(JSON.stringify({ code: 0, data: { id: 'task-123', status: 'processing' } }), { status: 200 });
    }
    if (url.endsWith('/api/ai/query')) {
      return new Response(JSON.stringify({ code: 0, data: { id: 'task-123', status: 'success', videos: ['https://cdn.movoa.ai/demo.mp4'] } }), { status: 200 });
    }
    throw new Error('unexpected url ' + url);
  };
  const client = createMovoaClient({ apiKey: 'sk-test', fetch: mockFetch });
  assert.equal(await client.getCredits(), 42);
  const run = await client.submitVideo({ prompt: 'calm ocean waves at dusk', duration: 6 });
  assert.equal(run.id, 'task-123');
  assert.equal(calls[1].body.options.sound, true);
  const done = await client.waitForVideo('task-123', { intervalMs: 1, timeoutMs: 1000 });
  assert.equal(done.videos[0], 'https://cdn.movoa.ai/demo.mp4');
});

test('live wrong-key smoke test hits movoa.ai auth branch', async () => {
  const client = createMovoaClient({ apiKey: 'sk-invalid-smoke-test-key' });
  await assert.rejects(
    () => client.getCredits(),
    (err) => err instanceof MovoaError && err.kind === 'auth',
  );
});
