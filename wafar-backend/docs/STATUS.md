# STATUS.md — where the backend is

Newest entry at the bottom. Each milestone adds one entry.

---

## 2026-11-07 · A0a — Scaffold (no credentials)

**Built**

- Repo: git (`main`), `.gitignore` (Node), `.gitattributes` (LF), CI in `.github/workflows/ci.yml` (`npm ci`, `npm run check`, `npm run build` on Node 24).
- `backend/`: TypeScript 7, strict ESM, Hono, Kysely + pg, zod 4, pino, vitest, biome. Node 24+ runs the `.ts` sources directly for `npm run dev` (no tsx); `npm run build` compiles to `dist/`.
- `src/config.ts`: env vars → typed `Config`. Startup fails with the full list of problems. Required now: `DATABASE_URL` (rejects port 6543), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Integration keys are optional until their milestone; empty values from `.env.example` count as missing; errors never echo values.
- `src/lib/logger.ts`: pino JSON in Cloud Logging format (`severity`, `message`). Phone fields are masked (`+2010****4567`), bodies, transcripts, images, tokens and passwords are redacted.
- `GET /health`: `{"status":"ok","db":"ok"}`, or 503 `{"status":"degraded","db":"error"}` if `select 1` fails or takes over 2 s. JSON 404 and 500 handlers.
- `src/lib/money.ts`: integer piastres. `toPiastres`, `fromNumericString`, `toNumericString`, `parseMoneyInput` ("5000", "5,000", "٥٠٠٠", "5k", "٥ آلاف", "450 جنيه"…), `formatMoney` (`1,250 EGP` / `١٬٢٥٠ جنيه`).
- `src/ai/receipt.ts`: zod `ReceiptSchema`. A test converts it to JSON Schema and checks it is identical to `schemas/receipt_extraction.schema.json`.
- `src/rules/receiptValidation.ts`: the AGENTS.md §7 rules, including VAT included or added on top, and voice/text purchases where the user's amount wins.
- `src/db/schema.generated.ts`: hand-written from `0001_init.sql`; `src/db/index.ts` keeps `date` columns as strings.
- Shared test cases in `fixtures/rules/` (`money.json`, `receipt_validation.json`, `receipt_schema.json`, `mask_phone.json`). 120 tests pass.
- Packages not installed yet: `@anthropic-ai/sdk`, `sharp`, `@supabase/supabase-js` and `@google-cloud/speech` arrive with the milestones that use them (A1, A3, A4), so A0a carries no unused dependencies.

**How to try it (PowerShell, from `wafar-backend\backend`)**

```powershell
npm install
npm run check          # format, lint, typecheck, 120 tests
npm run build
node dist/main.js      # without .env: prints the list of missing variables and exits
```

**Open**

- `npm run migrate` is a placeholder until A0b. The `0001_init.sql` tables already exist in Supabase (applied by hand, no `schema_migrations` table), so the A0b migrator must record 0001 as applied without running it again.
- Supabase connection checked on 2026-11-07 with `npm run db:check`: session pooler (`aws-0-eu-west-1`), TLS verified against `backend/certs/supabase-root-2021.crt`, 15 tables plus the `latest_prices` view, Storage buckets `receipts` and `voice-notes`. Local `/health` returns `{"status":"ok","db":"ok"}`. The A0b Dockerfile must copy `certs/` into the image.
- Not decided yet (`AGENTS.md` and the PRD don't say): what to do with receipts where Claude reports `currency: "other"` or the issue `multiple_receipts`. Both are currently saved like any other receipt. Decide before A3.

**Next: A0b.** Needs `DATABASE_URL` (Supabase **session pooler**, port 5432), `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`. For the deploy part: Docker Desktop, the Google Cloud CLI and a Google Cloud project with billing.
