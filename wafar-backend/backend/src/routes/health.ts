import { Hono } from 'hono';
import type { Logger } from '../lib/logger.ts';

export type DbCheck = () => Promise<void>;

export interface HealthDeps {
  checkDb: DbCheck;
  logger: Logger;
  /** How long the database gets to answer before /health reports degraded. */
  timeoutMs?: number;
}

/** GET /health → 200 {"status":"ok","db":"ok"} or 503 {"status":"degraded","db":"error"}. */
export function healthRoutes({ checkDb, logger, timeoutMs = 2_000 }: HealthDeps): Hono {
  const app = new Hono();
  app.get('/health', async (c) => {
    try {
      await withTimeout(checkDb(), timeoutMs);
      return c.json({ status: 'ok', db: 'ok' });
    } catch (err) {
      logger.warn({ err: errorSummary(err) }, 'health check: database not reachable');
      return c.json({ status: 'degraded', db: 'error' }, 503);
    }
  });
  return app;
}

function withTimeout(promise: Promise<void>, ms: number): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Name and message only: driver errors can carry connection details in other fields. */
export function errorSummary(err: unknown): { name: string; message: string } {
  return err instanceof Error
    ? { name: err.name, message: err.message }
    : { name: 'Error', message: String(err) };
}
