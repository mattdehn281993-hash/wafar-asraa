import { describe, expect, it } from 'vitest';
import { formatConfigErrors, loadConfig } from './config.ts';

const minimal = {
  DATABASE_URL: 'postgresql://postgres.abc:pw@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
  SUPABASE_URL: 'https://abc.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
};

describe('loadConfig', () => {
  it('accepts the minimum and fills defaults', () => {
    const result = loadConfig(minimal);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config).toMatchObject({
      port: 8080,
      appEnv: 'local',
      logLevel: 'info',
      sttProvider: 'google',
      claudeReceiptModel: 'claude-haiku-5-5',
    });
    expect(result.config.anthropicApiKey).toBeUndefined();
  });

  it('lists every missing required variable at once', () => {
    expect(loadConfig({})).toEqual({
      ok: false,
      errors: [
        'DATABASE_URL is missing',
        'SUPABASE_SERVICE_ROLE_KEY is missing',
        'SUPABASE_URL is missing',
      ],
    });
  });

  it('treats empty values copied from .env.example as missing', () => {
    const result = loadConfig({ ...minimal, SUPABASE_SERVICE_ROLE_KEY: '', WHAPI_TOKEN: '' });
    expect(result).toEqual({ ok: false, errors: ['SUPABASE_SERVICE_ROLE_KEY is missing'] });
  });

  it('rejects the Supabase transaction pooler (port 6543)', () => {
    const result = loadConfig({
      ...minimal,
      DATABASE_URL: 'postgresql://u:pw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/^DATABASE_URL uses port 6543/);
  });

  it('never echoes secret values in errors', () => {
    const result = loadConfig({
      ...minimal,
      DATABASE_URL: 'mysql://user:topsecret@host/db',
      PORT: 'abc',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(' ')).not.toContain('topsecret');
    expect(result.errors.some((e) => e.startsWith('PORT '))).toBe(true);
  });

  it('parses PORT and APP_ENV', () => {
    const result = loadConfig({ ...minimal, PORT: '9000', APP_ENV: 'production' });
    expect(result.ok && result.config.port).toBe(9000);
    expect(result.ok && result.config.appEnv).toBe('production');
  });

  it('formats errors as a readable list', () => {
    expect(formatConfigErrors(['A is missing', 'B is missing'])).toBe(
      'Configuration error. Fix these environment variables (see .env.example):\n  - A is missing\n  - B is missing',
    );
  });
});
