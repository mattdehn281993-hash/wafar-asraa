import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { loadSchema } from '../../test/fixtures.ts';
import {
  type CatalogueEntry,
  catalogueText,
  createShoppingListReader,
  loadShoppingListAssets,
  type ShoppingList,
  ShoppingListSchema,
} from './shoppingList.ts';

type JsonObject = Record<string, unknown>;

/** Same normalisation as receipt.test.ts: drop descriptions/comments, `anyOf [X, null]` → `type: [X, "null"]`. */
function normalise(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(normalise);
  if (node === null || typeof node !== 'object') return node;
  const obj = node as JsonObject;
  const anyOf = obj.anyOf as JsonObject[] | undefined;
  if (anyOf?.length === 2 && anyOf.some((s) => s.type === 'null')) {
    const other = anyOf.find((s) => s.type !== 'null') as JsonObject;
    const { anyOf: _drop, ...rest } = obj;
    return normalise({ ...rest, ...other, type: [other.type, 'null'] });
  }
  const out: JsonObject = {};
  for (const [key, value] of Object.entries(obj)) {
    if (['description', '$comment', '$schema'].includes(key)) continue;
    out[key] = key === 'required' ? [...(value as string[])].sort() : normalise(value);
  }
  return out;
}

const catalogue: CatalogueEntry[] = [
  { id: 'milk', name: 'Full cream milk', name_ar: 'حليب كامل الدسم' },
  { id: 'rice', name: 'Egyptian rice', name_ar: 'أرز مصري' },
];
const image = { media_type: 'image/jpeg' as const, data: 'AAAA' };
const list: ShoppingList = {
  kind: 'shopping_list',
  language: 'ar',
  items: [{ raw_text: 'لبن ٢', name_en: 'milk', quantity: 2, unit: null, product_id: 'milk' }],
  issues: [],
};

/** A stand-in for client.messages.create that returns the given replies in order. */
function fakeClient(...replies: Partial<Anthropic.Message>[]) {
  const create = vi.fn();
  for (const reply of replies) create.mockResolvedValueOnce(reply);
  return { client: { messages: { create } } as unknown as Pick<Anthropic, 'messages'>, create };
}
const textReply = (value: unknown, stop_reason: Anthropic.Message['stop_reason'] = 'end_turn') => ({
  stop_reason,
  content: [
    {
      type: 'text' as const,
      text: typeof value === 'string' ? value : JSON.stringify(value),
      citations: null,
    },
  ],
});

describe('ShoppingListSchema', () => {
  it('matches schemas/shopping_list_extraction.schema.json exactly', () => {
    const fromFile = loadSchema<JsonObject>('shopping_list_extraction.schema.json');
    expect(normalise(z.toJSONSchema(ShoppingListSchema))).toEqual(normalise(fromFile));
  });

  it('loads the prompt and sends the schema without its $comment', () => {
    const assets = loadShoppingListAssets();
    expect(assets.systemPrompt).toContain('shopping lists');
    expect(assets.schema).not.toHaveProperty('$comment');
    expect(assets.schema.type).toBe('object');
  });
});

describe('catalogueText', () => {
  it('lists one product per line as id | English | Arabic', () => {
    expect(catalogueText(catalogue)).toContain('milk | Full cream milk | حليب كامل الدسم');
    expect(catalogueText(catalogue)).toContain('rice | Egyptian rice | أرز مصري');
  });
});

describe('createShoppingListReader', () => {
  const assets = loadShoppingListAssets();

  it('sends the photo and catalogue with the JSON schema, and parses the answer', async () => {
    const { client, create } = fakeClient(textReply(list));
    const read = createShoppingListReader({ client, model: 'claude-haiku-5-5', assets });
    expect(await read(image, catalogue)).toEqual({ ok: true, value: list });

    const request = create.mock.calls[0]?.[0];
    expect(request.model).toBe('claude-haiku-5-5');
    expect(request.output_config.format).toEqual({ type: 'json_schema', schema: assets.schema });
    expect(request.messages[0].content[0]).toEqual({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' },
    });
    expect(request.messages[0].content[1].text).toContain('milk | Full cream milk');
  });

  it('retries once with a higher limit when cut off', async () => {
    const { client, create } = fakeClient(textReply('{"kind":', 'max_tokens'), textReply(list));
    const read = createShoppingListReader({ client, model: 'm', assets, maxTokens: 1000 });
    expect(await read(image, catalogue)).toEqual({ ok: true, value: list });
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1]?.[0].max_tokens).toBe(2000);
  });

  it('gives up after the retry is cut off too', async () => {
    const { client } = fakeClient(textReply('{', 'max_tokens'), textReply('{', 'max_tokens'));
    const read = createShoppingListReader({ client, model: 'm', assets });
    expect(await read(image, catalogue)).toEqual({ ok: false, reason: 'too_long' });
  });

  it('reports a refusal without reading the content', async () => {
    const { client } = fakeClient({ stop_reason: 'refusal', content: [] });
    const read = createShoppingListReader({ client, model: 'm', assets });
    expect(await read(image, catalogue)).toEqual({ ok: false, reason: 'refused' });
  });

  it.each([
    ['text that is not JSON', textReply('not json')],
    ['JSON in the wrong shape', textReply({ kind: 'shopping_list' })],
    ['no text block', { stop_reason: 'end_turn' as const, content: [] }],
  ])('rejects %s', async (_name, reply) => {
    const { client } = fakeClient(reply);
    const read = createShoppingListReader({ client, model: 'm', assets });
    expect(await read(image, catalogue)).toEqual({ ok: false, reason: 'invalid_output' });
  });
});
