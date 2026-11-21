import { Writable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';
import type { ShoppingList, ShoppingListReader } from '../ai/shoppingList.ts';
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

type DemoResponse = {
  kind: string;
  items: { product_id: string | null }[];
  basket: { lines: { product_id: string; quantity: number }[]; unmatched: string[] };
};

const catalogue = [
  { id: 'milk', name: 'Full cream milk', name_ar: 'حليب كامل الدسم' },
  { id: 'rice', name: 'Egyptian rice', name_ar: 'أرز مصري' },
];
const body = { image: { media_type: 'image/jpeg', data: 'AAAA' }, catalogue };
const list: ShoppingList = {
  kind: 'shopping_list',
  language: 'ar',
  items: [
    { raw_text: 'لبن ٢', name_en: 'milk', quantity: 2, unit: null, product_id: 'milk' },
    { raw_text: 'طماطم', name_en: 'tomatoes', quantity: 1, unit: 'كيلو', product_id: null },
    { raw_text: 'زيت', name_en: 'oil', quantity: 1, unit: null, product_id: 'oil' },
  ],
  issues: [],
};

function appWith(
  readShoppingList?: ShoppingListReader,
  rateLimit?: { max: number; windowMs: number },
) {
  return createApp({ checkDb: async () => {}, logger: silent, readShoppingList, rateLimit });
}
function post(
  app: ReturnType<typeof appWith>,
  payload: unknown,
  headers: Record<string, string> = {},
) {
  return app.request('/demo/shopping-list', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

describe('POST /demo/shopping-list', () => {
  it('reads the list and returns basket lines for catalogue products', async () => {
    const read = vi.fn<ShoppingListReader>().mockResolvedValue({ ok: true, value: list });
    const res = await post(appWith(read), body);
    expect(res.status).toBe(200);
    const json = (await res.json()) as DemoResponse;
    expect(json.kind).toBe('shopping_list');
    expect(json.basket).toEqual({
      lines: [{ product_id: 'milk', quantity: 2 }],
      unmatched: ['طماطم', 'زيت'],
    });
    // An id Claude made up ("oil" is not in this catalogue) is not passed on.
    expect(json.items[2]?.product_id).toBeNull();
    expect(read).toHaveBeenCalledWith(body.image, catalogue);
  });

  it('returns no basket when the photo is a receipt', async () => {
    const read = vi.fn<ShoppingListReader>().mockResolvedValue({
      ok: true,
      value: { ...list, kind: 'receipt' },
    });
    const json = (await (await post(appWith(read), body)).json()) as DemoResponse;
    expect(json.kind).toBe('receipt');
    expect(json.basket).toEqual({ lines: [], unmatched: [] });
  });

  it('answers 503 when Claude is not configured', async () => {
    const res = await post(appWith(undefined), body);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'not_configured' });
  });

  it.each([
    ['not JSON', 'nope'],
    [
      'a data: URL instead of plain base64',
      { ...body, image: { media_type: 'image/jpeg', data: 'data:image/jpeg;base64,AAAA' } },
    ],
    ['an unsupported image type', { ...body, image: { media_type: 'image/gif', data: 'AAAA' } }],
    ['an empty catalogue', { ...body, catalogue: [] }],
    [
      'a catalogue id with spaces',
      { ...body, catalogue: [{ id: 'bad id', name: 'x', name_ar: 'x' }] },
    ],
    ['unknown fields', { ...body, extra: true }],
  ])('rejects %s with 400', async (_name, payload) => {
    const read = vi.fn<ShoppingListReader>();
    const res = await post(appWith(read), payload);
    expect(res.status).toBe(400);
    expect(read).not.toHaveBeenCalled();
  });

  it('rejects a body that is too large with 413', async () => {
    const read = vi.fn<ShoppingListReader>();
    const big = { ...body, image: { media_type: 'image/jpeg', data: 'A'.repeat(6_200_000) } };
    const res = await post(appWith(read), big);
    expect(res.status).toBe(413);
    expect(read).not.toHaveBeenCalled();
  });

  it('answers 422 when Claude could not read the photo', async () => {
    const read = vi.fn<ShoppingListReader>().mockResolvedValue({ ok: false, reason: 'refused' });
    const res = await post(appWith(read), body);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'unreadable', reason: 'refused' });
  });

  it('answers 502 when the Claude call throws', async () => {
    const read = vi.fn<ShoppingListReader>().mockRejectedValue(new Error('network down'));
    const res = await post(appWith(read), body);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'ai_unavailable' });
  });

  it('limits each visitor to the configured number of requests', async () => {
    const read = vi.fn<ShoppingListReader>().mockResolvedValue({ ok: true, value: list });
    const app = appWith(read, { max: 2, windowMs: 60_000 });
    const a = { 'x-forwarded-for': '203.0.113.5' };
    expect((await post(app, body, a)).status).toBe(200);
    expect((await post(app, body, a)).status).toBe(200);
    expect((await post(app, body, a)).status).toBe(429);
    // Another visitor is not affected.
    expect((await post(app, body, { 'x-forwarded-for': '198.51.100.7' })).status).toBe(200);
    expect(read).toHaveBeenCalledTimes(3);
  });
});
