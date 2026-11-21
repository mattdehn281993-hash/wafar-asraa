import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { loadFixture, loadSchema, mergeTopLevel } from '../../test/fixtures.ts';
import { ReceiptSchema } from './receipt.ts';

type JsonObject = Record<string, unknown>;

/**
 * Brings both JSON schemas to one comparable form: drops descriptions,
 * comments and zod's date regex, turns `anyOf [X, null]` into
 * `type: [X, "null"]`, and sorts `required`.
 */
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
    if (['description', '$comment', '$schema', 'pattern'].includes(key)) continue;
    out[key] = key === 'required' ? [...(value as string[])].sort() : normalise(value);
  }
  return out;
}

describe('ReceiptSchema', () => {
  it('matches schemas/receipt_extraction.schema.json exactly', () => {
    const fromFile = loadSchema<JsonObject>('receipt_extraction.schema.json');
    const fromZod = z.toJSONSchema(ReceiptSchema);
    expect(normalise(fromZod)).toEqual(normalise(fromFile));
  });

  const fx = loadFixture<{
    base_receipt: JsonObject;
    invalid: { name: string; receipt?: JsonObject; remove?: string[] }[];
  }>('rules/receipt_schema.json');

  it('accepts a sample receipt', () => {
    expect(ReceiptSchema.safeParse(fx.base_receipt).success).toBe(true);
  });

  it.each(fx.invalid)('rejects: $name', ({ receipt, remove }) => {
    const input = mergeTopLevel(fx.base_receipt, receipt, remove);
    expect(ReceiptSchema.safeParse(input).success).toBe(false);
  });
});
