import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import type { ShoppingListReader } from '../ai/shoppingList.ts';
import type { Logger } from '../lib/logger.ts';
import { listToBasket } from '../rules/shoppingList.ts';
import { errorSummary } from './health.ts';

// Endpoints for the investor web demo (a separate Vite app). Not part of the
// WhatsApp bot. Shapes are documented in docs/API.md.

/** About 6 MB of base64 ≈ a 4.5 MB photo. The demo resizes photos to ~0.5 MB first. */
const MAX_IMAGE_BASE64 = 6_000_000;
const MAX_BODY_BYTES = MAX_IMAGE_BASE64 + 100_000;

const RequestSchema = z.strictObject({
  image: z.strictObject({
    media_type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    data: z
      .string()
      .min(1)
      .max(MAX_IMAGE_BASE64)
      .regex(/^[A-Za-z0-9+/]+={0,2}$/, 'must be base64 without a data: prefix'),
  }),
  catalogue: z
    .array(
      z.strictObject({
        id: z.string().regex(/^[a-z0-9_-]{1,40}$/),
        name: z.string().trim().min(1).max(80),
        name_ar: z.string().trim().min(1).max(80),
      }),
    )
    .min(1)
    .max(200),
});

export interface DemoDeps {
  /** Missing when ANTHROPIC_API_KEY is not set or the demo API is turned off. */
  readShoppingList?: ShoppingListReader | undefined;
  logger: Logger;
  /** Requests allowed per visitor per window. Each request is a paid Claude call. */
  rateLimit?: { max: number; windowMs: number } | undefined;
  now?: (() => number) | undefined;
}

export function demoRoutes({
  readShoppingList,
  logger,
  rateLimit = { max: 20, windowMs: 10 * 60_000 },
  now = Date.now,
}: DemoDeps): Hono {
  const app = new Hono();
  const hits = new Map<string, { count: number; resetAt: number }>();

  /** Fixed-window counter per visitor. In memory: resets on restart, per instance. */
  function allow(visitor: string): boolean {
    const t = now();
    for (const [key, entry] of hits) if (entry.resetAt <= t) hits.delete(key);
    const entry = hits.get(visitor) ?? { count: 0, resetAt: t + rateLimit.windowMs };
    entry.count += 1;
    hits.set(visitor, entry);
    return entry.count <= rateLimit.max;
  }

  app.post(
    '/demo/shopping-list',
    bodyLimit({ maxSize: MAX_BODY_BYTES, onError: (c) => c.json({ error: 'too_large' }, 413) }),
    async (c) => {
      if (!readShoppingList) return c.json({ error: 'not_configured' }, 503);

      // Cloud Run puts the caller's address first in X-Forwarded-For.
      const visitor = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      if (!allow(visitor)) return c.json({ error: 'rate_limited' }, 429);

      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json({ error: 'invalid_request' }, 400);
      }
      const input = RequestSchema.safeParse(body);
      if (!input.success) return c.json({ error: 'invalid_request' }, 400);
      const { image, catalogue } = input.data;

      const started = now();
      let result: Awaited<ReturnType<ShoppingListReader>>;
      try {
        result = await readShoppingList(image, catalogue);
      } catch (err) {
        logger.error({ err: errorSummary(err) }, 'shopping list: Claude call failed');
        return c.json({ error: 'ai_unavailable' }, 502);
      }
      if (!result.ok) {
        logger.warn({ reason: result.reason, ms: now() - started }, 'shopping list: not read');
        return c.json({ error: 'unreadable', reason: result.reason }, 422);
      }

      const list = result.value;
      const ids = catalogue.map((p) => p.id);
      const known = new Set(ids);
      const basket =
        list.kind === 'shopping_list'
          ? listToBasket(list.items, ids)
          : { lines: [], unmatched: [] };
      // Counts only: list contents are personal (AGENTS.md §9).
      logger.info(
        {
          kind: list.kind,
          items: list.items.length,
          matched: basket.lines.length,
          ms: now() - started,
        },
        'shopping list read',
      );
      return c.json({
        kind: list.kind,
        language: list.language,
        issues: list.issues,
        items: list.items.map((item) => ({
          ...item,
          product_id:
            item.product_id !== null && known.has(item.product_id) ? item.product_id : null,
        })),
        basket,
      });
    },
  );

  return app;
}
