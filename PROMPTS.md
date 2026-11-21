# PROMPTS.md — what to paste into Claude Code

Use one prompt per Claude Code session, in order. Start a new session for each milestone. Each prompt assumes Claude Code has read `CLAUDE.md` (it does this automatically when VS Code is opened on the `wafar-backend` folder).

The backend is **TypeScript now**; a Rust port may come later (`AGENTS.md` §12). Every prompt below builds TypeScript.

Before pasting, check the **Needs** line: if a credential isn't in `.env` yet, Claude Code builds what it can and tells you what's missing.

---

## A0a — Scaffold (no credentials needed)

**Needs:** nothing.

```
Do milestone A0a from BUILD_PLAN.md.

Read AGENTS.md, BUILD_PLAN.md (A0), docs/PRD.md, migrations/0001_init.sql and schemas/receipt_extraction.schema.json first.

Set up git, .gitignore, .gitattributes and the folder layout from AGENTS.md section 3. Create the TypeScript backend in backend/ with the packages from AGENTS.md section 2 (npm install, latest stable versions, and say why for anything extra), strict ESM tsconfig, biome, and the npm scripts listed in BUILD_PLAN.md A0a. Build Config with zod (fails fast at startup with a clear list of missing variables, but npm run build and npm test must work without a .env), pino JSON logging with redaction, and GET /health.

Write src/lib/money.ts (integer piastres), ai/receipt.ts (zod schema matching the receipt JSON schema exactly) and src/rules/receiptValidation.ts (the pure validation function from AGENTS.md section 7). Put the test cases as data in fixtures/rules/money.json and fixtures/rules/receipt_validation.json, covering every case listed in BUILD_PLAN.md A0a, and drive the vitest tests from those files. Write db/schema.generated.ts by hand from 0001_init.sql.

Add .github/workflows/ci.yml (npm ci, npm run check). Create docs/STATUS.md.

Do not connect to any database or external service in this milestone. When done, run npm run check, commit, and give me the exact list of .env variables I need to fill in for A0b.
```

---

## A0b — Connect Supabase and deploy

**Needs:** `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in `.env`. For the deploy part: Docker Desktop, the Google Cloud CLI, `gcloud auth login` done and a Google Cloud project with billing.

```
Do milestone A0b from BUILD_PLAN.md.

First, read-only: connect with DATABASE_URL and report what already exists in the Supabase database (tables, enums, storage buckets, row counts) compared with migrations/0001_init.sql. Follow the three cases in BUILD_PLAN.md A0b exactly. If the database has a different schema, stop and show me the differences before changing anything.

Then build scripts/migrate.ts (schema_migrations table with checksums, --mark-applied), regenerate db/schema.generated.ts with npm run db:types, make /health check the database for real, and add the Dockerfile (multi-stage node:24-slim, production dependencies only, non-root node user, listens on $PORT). Test the container locally if Docker is available.

For Cloud Run: show me the exact gcloud commands (Artifact Registry, Secret Manager secrets, Cloud Run service in europe-west3 with min instances 1 and CPU always allocated) and wait for my go-ahead before running them. After deploy, add the deploy job to CI.
```

---

## A1 — WhatsApp in and out

**Needs:** `WHAPI_API_URL`, `WHAPI_TOKEN`, `WHAPI_WEBHOOK_SECRET` (any long random string you make up). A test phone.

```
Do milestone A1 from BUILD_PLAN.md.

Before writing any parser: read Whapi's current official docs for webhooks, sending text and downloading media. Then give me a short step-by-step for capturing real webhook payloads (text, image, image with caption, voice note, reply, group message) into fixtures/whapi/, with phone numbers replaced by fake ones. Write the zod schemas from those captured files only.

Then build the webhook route with the secret check, wa_messages logging, wa_message_id idempotency, immediate 200 and background processing with processInBackground() (never awaited in the request, every error caught and logged), the WhatsAppGateway interface with a WhapiClient implementation, the outbound rate limit, and a temporary "Got it" reply. Include fixture tests and a test that a replayed webhook creates one row and one reply.

Tell me exactly how to point the Whapi webhook at the service (local tunnel for testing, then the Cloud Run URL).
```

---

## A2 — Onboarding

**Needs:** nothing new.

```
Do milestone A2 from BUILD_PLAN.md.

Create locales/en.json and locales/ar.json starting from the starter bot copy in the BUILD_PLAN.md appendix (Arabic stays Egyptian dialect), and i18n.ts that fails at startup if a key exists in one language but not the other. Add migration 0002_conversation_state.sql exactly as described in BUILD_PLAN.md A2 and show it to me before applying it.

Build the onboarding flow exactly as in AGENTS.md section 8 and BUILD_PLAN.md A2, including resuming halfway, username validation with suggestions, budget parsing for "5000", "5,000", "٥٠٠٠" and "5k", and creating the family with the user as owner. Keep the step logic as pure functions in src/rules/ with test cases in fixtures/rules/.
```

---

## A3 — Receipt reading (photos)

**Needs:** `ANTHROPIC_API_KEY`, `CLAUDE_RECEIPT_MODEL` (start with `claude-haiku-5-5`). 20 receipt photos for the accuracy test.

```
Do milestone A3 from BUILD_PLAN.md.

Check Anthropic's current docs for structured outputs (output_config.format with json_schema) and image input before writing the client. Build ai/claude.ts with the official @anthropic-ai/sdk, following AGENTS.md section 7 exactly: system prompt from prompts/receipt_system.md, schema from schemas/receipt_extraction.schema.json, stop_reason handling, retries with backoff, image resized with sharp to max 1568 px on the long edge.

Wire it into the bot: download image, upload to the private receipts bucket, create the receipts row, call Claude, parse with zod, convert to piastres, validate with src/rules/receiptValidation.ts, save store/items, reply with the confirmation from the locale files, or ask for a clearer photo. Add corrections ("the total was 450").

Then set up the accuracy test (LIVE_AI=1 npm run test:live): tell me how to lay out my 20 receipts and their expected JSON in fixtures/receipts/, run both claude-haiku-5-5 and claude-sonnet-5-5, and write the comparison to docs/receipt-accuracy.md so we can pick the model.
```

---

## A4 — Voice notes and typed purchases

**Needs:** Google Speech-to-Text API enabled; `STT_PROVIDER=google` and credentials (or Cloud Run's service account).

```
Do milestone A4 from BUILD_PLAN.md.

Check Google Cloud Speech-to-Text's current docs for Egyptian Arabic (ar-EG) with an English alternative and for the audio format WhatsApp voice notes use. Build ai/stt.ts with @google-cloud/speech, store voice notes in the voice-notes bucket and transcripts in receipts.transcript, and send transcripts and typed purchases through the same Claude extraction and validation as photos (with the voice/text rules in AGENTS.md section 7).

Build bot/router.ts: keyword shortcuts first for obvious commands, then a small Claude call with strict JSON output for intent (purchase, spending question, family command, memory command, correction, small talk). Include tests that "how much did I spend?" is never saved as a purchase.
```

---

## A5 — Product matching and prices

**Needs:** nothing new; an `ADMIN_PASSWORD` in `.env` for the review page.

```
Do milestone A5 from BUILD_PLAN.md.

Build matching.ts in the order barcode → store alias → global alias → pg_trgm similarity (auto-match only above 0.75). Put Arabic name normalisation in src/rules/normaliseName.ts (أ إ آ → ا, ة → ه, ى → ي, remove diacritics and tatweel, Arabic-Indic digits to Western) with test cases in fixtures/rules/normalise_name.json. Create unverified products and aliases when nothing matches, and insert prices for matched lines with a known store. Never put user data in prices.

Add a minimal internal review page (server-rendered HTML from Hono, protected by ADMIN_PASSWORD) to confirm or change unmatched and low-score lines.
```

---

## A6 — Family

```
Do milestone A6 from BUILD_PLAN.md: invites by username or phone in both languages, accept/decline, the one-active-family rule with a friendly explanation, owner-only invite/remove, "leave family", and receipts saved with the user's current family_id. Rules as pure functions with tests for every rule.
```

---

## A7 — Spending summaries

```
Do milestone A7 from BUILD_PLAN.md: on-demand questions by week, month, category and store in both languages; the monthly status line; the outbox migration described in A7; the weekly summary (Friday morning Cairo time, only inside the 24-hour window, otherwise held in the outbox until the user's next message); the monthly report on the 1st. Scheduled jobs are protected internal endpoints for Cloud Scheduler, not in-process timers; show me the migration and the Cloud Scheduler commands before applying or creating anything. All EGP formatting through money.ts. Add a test that compares summary totals with a direct SQL sum, and one that running the weekly job twice sends nothing the second time.
```

---

## A8 — Memory

```
Do milestone A8 from BUILD_PLAN.md: detect reasons and facts and save memory_notes with kind, category and applies_until; "what do you remember?" in both languages; "forget 2" and "forget the birthday"; pass active notes into the Claude calls that answer questions. Include a test that notes never leak between users or families.
```

---

## A9 — Overspend alerts

```
Do milestone A9 from BUILD_PLAN.md: after each saved receipt, check the 80% and 100% thresholds (family and category budgets) and the unusual-receipt rule (more than 3x the family's median over 60 days, at least 5 receipts); suppress with suppressed_by when an active memory note covers it; rely on the unique index for once-per-month. Write the alert rules as pure functions in src/rules/ with test cases in fixtures/rules/alerts.json, and copy that is warm and includes days left and one practical tip.
```

---

## A10 — Hardening and pilot launch

```
Do milestone A10 from BUILD_PLAN.md: friendly messages on every failure path, Cloud Monitoring alerts on error rate and webhook failures (show me the commands first), a daily processing summary, "delete my data" with confirmation exactly as described in A10 (family ownership, Storage files, messages by phone), a load check of 50 receipts in 5 minutes, and docs/RUNBOOK.md (deploy, roll back, rotate keys, re-run a failed receipt, what to do if the Whapi number is banned). Then go through the MVP finish line in BUILD_PLAN.md and report which boxes are ticked and what is still open.
```

---

## When something breaks

```
Something is wrong: <describe what you did and what happened>.
Get the real error first (logs, the failing request, the exact response) before changing code. Tell me the cause in one or two sentences, then fix it with a test that would have caught it.
```
