import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';
import { createLogger } from '../lib/logger.ts';

const silent = createLogger(
  'fatal',
  new Writable({
    write(_chunk, _encoding, done) {
      done();
    },
  }),
);

describe('GET /health', () => {
  it('returns ok when the database answers', async () => {
    const app = createApp({ checkDb: async () => {}, logger: silent });
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', db: 'ok' });
  });

  it('returns 503 degraded when the database fails', async () => {
    const app = createApp({
      checkDb: async () => {
        throw new Error('connection refused');
      },
      logger: silent,
    });
    const res = await app.request('/health');
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'degraded', db: 'error' });
  });

  it('returns 503 when the database hangs', async () => {
    const app = createApp({ checkDb: () => new Promise(() => {}), logger: silent });
    const started = Date.now();
    const res = await app.request('/health');
    expect(res.status).toBe(503);
    expect(Date.now() - started).toBeLessThan(5_000);
  }, 10_000);

  it('returns JSON 404 for unknown routes', async () => {
    const app = createApp({ checkDb: async () => {}, logger: silent });
    const res = await app.request('/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });
});
