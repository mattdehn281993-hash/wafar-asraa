import { readFileSync } from 'node:fs';
import type { ConnectionOptions } from 'node:tls';
import { Kysely, PostgresDialect, sql } from 'kysely';
import pg from 'pg';
import type { DB } from './schema.generated.ts';

export type Database = Kysely<DB>;

// Keep `date` columns as 'YYYY-MM-DD' strings (AGENTS.md §5) instead of
// letting pg turn them into local-time Date objects. numeric already arrives
// as a string; convert it with lib/money.ts.
pg.types.setTypeParser(pg.types.builtins.DATE, (value: string) => value);

// Supabase signs its Postgres certificates with its own root CA, which Node
// does not trust by default. This is the public "Supabase Root 2021 CA"
// (valid until 2031-04-26, SHA-256 80:70:25:AD:...:72:E6:CA:FA), the same file
// as Dashboard > Database > SSL Configuration > Download certificate.
// The path is the same from src/db and dist/db.
const SUPABASE_CA_PATH = new URL('../../certs/supabase-root-2021.crt', import.meta.url);

/**
 * TLS settings for a database URL: Supabase hosts are verified against the
 * Supabase root CA; anything else uses pg's defaults (from the URL).
 * Certificate checking is never turned off.
 * Do not add `sslmode=` to DATABASE_URL: pg would let it replace these settings.
 */
export function tlsFor(databaseUrl: string): ConnectionOptions | undefined {
  let host: string;
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    return undefined;
  }
  if (!/\.supabase\.(com|co)$/.test(host)) return undefined;
  return { ca: readFileSync(SUPABASE_CA_PATH, 'utf8'), rejectUnauthorized: true };
}

/** Creates the pool. No connection is opened until the first query. */
export function createDb(databaseUrl: string): Database {
  const ssl = tlsFor(databaseUrl);
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ...(ssl ? { ssl } : {}),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  return new Kysely<DB>({ dialect: new PostgresDialect({ pool }) });
}

export async function pingDb(db: Database): Promise<void> {
  await sql`select 1`.execute(db);
}
