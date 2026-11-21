import { readFileSync } from 'node:fs';
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Reads a photo of a shopping list with Claude (demo endpoint POST /demo/shopping-list).
// The zod schema mirrors schemas/shopping_list_extraction.schema.json (the source of
// truth); shoppingList.test.ts checks they stay identical. Change the JSON file first.

export const LIST_KINDS = ['shopping_list', 'receipt', 'other'] as const;
export const LIST_ISSUES = ['blurry', 'cut_off', 'partly_unreadable'] as const;

export const ShoppingListItemSchema = z.strictObject({
  raw_text: z.string(),
  name_en: z.string(),
  quantity: z.number(),
  unit: z.string().nullable(),
  product_id: z.string().nullable(),
});

export const ShoppingListSchema = z.strictObject({
  kind: z.enum(LIST_KINDS),
  language: z.enum(['ar', 'en', 'mixed']),
  items: z.array(ShoppingListItemSchema),
  issues: z.array(z.enum(LIST_ISSUES)),
});

export type ShoppingList = z.infer<typeof ShoppingListSchema>;
export type ShoppingListItem = z.infer<typeof ShoppingListItemSchema>;

export interface CatalogueEntry {
  id: string;
  name: string;
  name_ar: string;
}

export interface ListImage {
  media_type: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Base64, no data: prefix. */
  data: string;
}

export type ReadListFailure = 'refused' | 'too_long' | 'invalid_output';
export type ReadListResult =
  | { ok: true; value: ShoppingList }
  | { ok: false; reason: ReadListFailure };
export type ShoppingListReader = (
  image: ListImage,
  catalogue: readonly CatalogueEntry[],
) => Promise<ReadListResult>;

/** The prompt and JSON schema, read once at startup. Both live outside backend/ (see AGENTS.md §12). */
export interface ShoppingListAssets {
  systemPrompt: string;
  schema: Record<string, unknown>;
}

const REPO_ROOT = new URL('../../../', import.meta.url);

export function loadShoppingListAssets(root: URL = REPO_ROOT): ShoppingListAssets {
  const systemPrompt = readFileSync(new URL('prompts/shopping_list_system.md', root), 'utf8');
  const raw = JSON.parse(
    readFileSync(new URL('schemas/shopping_list_extraction.schema.json', root), 'utf8'),
  ) as Record<string, unknown>;
  const { $comment: _comment, ...schema } = raw;
  return { systemPrompt, schema };
}

/** The user-message text: the catalogue Claude may match against. */
export function catalogueText(catalogue: readonly CatalogueEntry[]): string {
  const lines = catalogue.map((p) => `${p.id} | ${p.name} | ${p.name_ar}`);
  return [
    'Catalogue (id | English name | Arabic name):',
    ...lines,
    '',
    'Read the shopping list in the photo.',
  ].join('\n');
}

export interface ReaderOptions {
  client: Pick<Anthropic, 'messages'>;
  model: string;
  assets: ShoppingListAssets;
  maxTokens?: number;
}

export function createShoppingListReader({
  client,
  model,
  assets,
  maxTokens = 8_000,
}: ReaderOptions): ShoppingListReader {
  return async (image, catalogue) => {
    const request = (limit: number) =>
      client.messages.create({
        model,
        max_tokens: limit,
        system: assets.systemPrompt,
        output_config: {
          effort: 'medium',
          format: { type: 'json_schema', schema: assets.schema },
        },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: image.media_type, data: image.data },
              },
              { type: 'text', text: catalogueText(catalogue) },
            ],
          },
        ],
      });

    let response = await request(maxTokens);
    // AGENTS.md §7: retry once with more room when the answer was cut off.
    if (response.stop_reason === 'max_tokens') response = await request(maxTokens * 2);

    if (response.stop_reason === 'refusal') return { ok: false, reason: 'refused' };
    if (response.stop_reason === 'max_tokens') return { ok: false, reason: 'too_long' };

    const text = response.content.find((block) => block.type === 'text');
    if (text?.type !== 'text') return { ok: false, reason: 'invalid_output' };
    let json: unknown;
    try {
      json = JSON.parse(text.text);
    } catch {
      return { ok: false, reason: 'invalid_output' };
    }
    const parsed = ShoppingListSchema.safeParse(json);
    return parsed.success
      ? { ok: true, value: parsed.data }
      : { ok: false, reason: 'invalid_output' };
  };
}
