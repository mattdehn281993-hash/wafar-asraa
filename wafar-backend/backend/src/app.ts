import { Hono } from 'hono';
import type { ShoppingListReader } from './ai/shoppingList.ts';
import type { Logger } from './lib/logger.ts';
import { demoRoutes } from './routes/demo.ts';
import { type DbCheck, errorSummary, healthRoutes } from './routes/health.ts';

export interface AppDeps {
  checkDb: DbCheck;
  logger: Logger;
  /** Set only when the demo API is on and ANTHROPIC_API_KEY exists. */
  readShoppingList?: ShoppingListReader | undefined;
  rateLimit?: { max: number; windowMs: number } | undefined;
}

/** Builds the HTTP app. Dependencies are passed in so tests need no database or network. */
export function createApp(deps: AppDeps): Hono {
  const app = new Hono();

  app.route('/', healthRoutes(deps));
  app.route('/', demoRoutes(deps));

  app.notFound((c) => c.json({ error: 'not_found' }, 404));
  app.onError((err, c) => {
    deps.logger.error({ err: errorSummary(err), path: c.req.path }, 'unhandled error');
    return c.json({ error: 'internal_error' }, 500);
  });

  return app;
}
