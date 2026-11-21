import pino, { type DestinationStream, type Logger } from 'pino';
import { maskPhone } from './phone.ts';

export type { Logger };

// Fields that may hold personal data or secrets. Phone fields are masked; the
// rest are replaced. Message bodies, transcripts and images are never logged.
const PHONE_KEYS = new Set(['phone', 'from', 'to', 'chat_id']);
const SENSITIVE_KEYS = [
  'phone',
  'from',
  'to',
  'chat_id',
  'body',
  'text',
  'caption',
  'transcript',
  'image',
  'media',
  'token',
  'apiKey',
  'api_key',
  'password',
  'secret',
  'authorization',
  'databaseUrl',
  'connectionString',
];
const REDACT_PATHS = [
  ...SENSITIVE_KEYS,
  ...SENSITIVE_KEYS.map((k) => `*.${k}`),
  'req.headers.authorization',
  'req.headers["x-api-key"]',
];

// Cloud Logging reads `severity` and `message` from JSON log lines.
const SEVERITY: Record<string, string> = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
};

export function createLogger(level: string, destination?: DestinationStream): Logger {
  return pino(
    {
      level,
      base: { service: 'wafar-backend' },
      messageKey: 'message',
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => ({ severity: SEVERITY[label] ?? 'DEFAULT' }),
      },
      redact: {
        paths: REDACT_PATHS,
        censor: (value: unknown, path: string[]) => {
          const key = path.at(-1) ?? '';
          return PHONE_KEYS.has(key) && typeof value === 'string' ? maskPhone(value) : '[redacted]';
        },
      },
    },
    destination,
  );
}
