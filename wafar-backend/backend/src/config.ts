import { z } from 'zod';

// Env vars → typed Config. Startup fails fast with the full list of problems.
// Always required: the database and Storage settings. Integration keys
// (Anthropic, Whapi, STT, admin) are optional here; each feature checks for its
// own key when it is built, so the server can run before every account exists.

const required = z.string().min(1);
const optional = z.string().min(1).optional();

function isPostgresUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'postgres:' || url.protocol === 'postgresql:';
  } catch {
    return false;
  }
}

const EnvSchema = z.object({
  DATABASE_URL: required
    .refine(isPostgresUrl, 'must be a postgres:// or postgresql:// connection string')
    .refine(
      (v) => !isPostgresUrl(v) || new URL(v).port !== '6543',
      'uses port 6543 (Supabase transaction pooler); use the session pooler on port 5432',
    ),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: required,
  ANTHROPIC_API_KEY: optional,
  CLAUDE_RECEIPT_MODEL: required.default('claude-haiku-5-5'),
  CLAUDE_CHAT_MODEL: required.default('claude-haiku-5-5'),
  WHAPI_API_URL: z.url().optional(),
  WHAPI_TOKEN: optional,
  WHAPI_WEBHOOK_SECRET: z.string().min(16, 'must be at least 16 characters').optional(),
  STT_PROVIDER: z.enum(['google']).default('google'),
  GOOGLE_APPLICATION_CREDENTIALS: optional,
  ADMIN_PASSWORD: z.string().min(12, 'must be at least 12 characters').optional(),
  APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),
  // Endpoints for the investor web demo (POST /demo/shopping-list). Unset: on only when APP_ENV=local.
  DEMO_API_ENABLED: z.enum(['true', 'false']).optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
});

const ConfigSchema = EnvSchema.transform((env) => ({
  databaseUrl: env.DATABASE_URL,
  supabaseUrl: env.SUPABASE_URL,
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  anthropicApiKey: env.ANTHROPIC_API_KEY,
  claudeReceiptModel: env.CLAUDE_RECEIPT_MODEL,
  claudeChatModel: env.CLAUDE_CHAT_MODEL,
  whapiApiUrl: env.WHAPI_API_URL,
  whapiToken: env.WHAPI_TOKEN,
  whapiWebhookSecret: env.WHAPI_WEBHOOK_SECRET,
  sttProvider: env.STT_PROVIDER,
  googleApplicationCredentials: env.GOOGLE_APPLICATION_CREDENTIALS,
  adminPassword: env.ADMIN_PASSWORD,
  appEnv: env.APP_ENV,
  demoApiEnabled:
    env.DEMO_API_ENABLED === undefined ? env.APP_ENV === 'local' : env.DEMO_API_ENABLED === 'true',
  logLevel: env.LOG_LEVEL,
  port: env.PORT,
}));

export type Config = z.output<typeof ConfigSchema>;

export type ConfigResult = { ok: true; config: Config } | { ok: false; errors: string[] };

const KNOWN_KEYS = Object.keys(EnvSchema.shape) as (keyof typeof EnvSchema.shape)[];

/**
 * Reads only the variables this service knows. Empty values (`WHAPI_TOKEN=`
 * copied from .env.example) count as not set. Error messages name the variable
 * but never include its value.
 */
export function loadConfig(env: Record<string, string | undefined>): ConfigResult {
  const input: Record<string, string> = {};
  for (const key of KNOWN_KEYS) {
    const value = env[key]?.trim();
    if (value) input[key] = value;
  }
  const parsed = ConfigSchema.safeParse(input);
  if (parsed.success) return { ok: true, config: parsed.data };

  const errors = parsed.error.issues.map((issue) => {
    const key = String(issue.path[0] ?? 'config');
    return input[key] === undefined ? `${key} is missing` : `${key} ${issue.message}`;
  });
  return { ok: false, errors: [...new Set(errors)].sort() };
}

export function formatConfigErrors(errors: string[]): string {
  return [
    'Configuration error. Fix these environment variables (see .env.example):',
    ...errors.map((e) => `  - ${e}`),
  ].join('\n');
}
