import Anthropic from '@anthropic-ai/sdk';
import { serve } from '@hono/node-server';
import {
  createShoppingListReader,
  loadShoppingListAssets,
  type ShoppingListReader,
} from './ai/shoppingList.ts';
import { createApp } from './app.ts';
import { formatConfigErrors, loadConfig } from './config.ts';
import { createDb, pingDb } from './db/index.ts';
import { createLogger } from './lib/logger.ts';

const result = loadConfig(process.env);
if (!result.ok) {
  console.error(formatConfigErrors(result.errors));
  process.exit(1);
}
const config = result.config;

const logger = createLogger(config.logLevel);
const db = createDb(config.databaseUrl);

// Demo endpoint: reading shopping-list photos with Claude.
let readShoppingList: ShoppingListReader | undefined;
if (!config.demoApiEnabled) {
  logger.info('demo API off (DEMO_API_ENABLED)');
} else if (!config.anthropicApiKey) {
  logger.warn('demo API: ANTHROPIC_API_KEY is not set, so shopping-list reading answers 503');
} else {
  readShoppingList = createShoppingListReader({
    client: new Anthropic({ apiKey: config.anthropicApiKey }),
    model: config.claudeReceiptModel,
    assets: loadShoppingListAssets(),
  });
  logger.info({ model: config.claudeReceiptModel }, 'demo API: shopping-list reading on');
}

const app = createApp({ checkDb: () => pingDb(db), logger, readShoppingList });

const server = serve({ fetch: app.fetch, port: config.port, hostname: '0.0.0.0' }, (info) => {
  logger.info({ port: info.port, env: config.appEnv }, 'server started');
});

// Cloud Run sends SIGTERM before stopping an instance.
let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutting down');
  server.close();
  await db.destroy();
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
