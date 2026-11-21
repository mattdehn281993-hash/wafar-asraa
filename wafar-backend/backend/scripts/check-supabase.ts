// Read-only connectivity check: database, Supabase API key, Storage.
// Run from backend/: node --env-file=../.env scripts/check-supabase.ts
// Never prints secrets.
import pg from 'pg';
import { tlsFor } from '../src/db/index.ts';

const dbUrl = process.env.DATABASE_URL ?? '';
const apiUrl = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

try {
  console.log(`DB host: ${new URL(dbUrl).host}`);
} catch {
  console.log('DATABASE_URL: not a valid URL');
}

const client = new pg.Client({
  connectionString: dbUrl,
  connectionTimeoutMillis: 8000,
  ssl: tlsFor(dbUrl) ?? true,
});
try {
  await client.connect();
  const v = await client.query('select current_user, version()');
  console.log(`DB: connected (TLS verified) as ${v.rows[0].current_user}`);
  console.log(`DB: ${String(v.rows[0].version).split(' on ')[0]}`);
  const t = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by 1",
  );
  const names = t.rows.map((r) => r.table_name).join(', ') || '(none)';
  console.log(`DB: ${t.rowCount} tables in public: ${names}`);
} catch (e) {
  const err = e as NodeJS.ErrnoException;
  console.log(`DB: FAILED (${err.code ?? 'no code'}) ${err.message.replaceAll(dbUrl, '<url>')}`);
} finally {
  await client.end().catch(() => {});
}

for (const [name, path] of [
  ['API key', '/rest/v1/'],
  ['Storage', '/storage/v1/bucket'],
] as const) {
  try {
    const res = await fetch(`${apiUrl}${path}`, {
      headers: { apikey: key, authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    let extra = '';
    if (path.includes('bucket') && res.ok) {
      const buckets = (await res.json()) as { name: string }[];
      extra = ` buckets: ${buckets.map((b) => b.name).join(', ') || '(none)'}`;
    }
    console.log(`${name}: HTTP ${res.status}${extra}`);
  } catch (e) {
    console.log(`${name}: FAILED ${(e as Error).message}`);
  }
}
