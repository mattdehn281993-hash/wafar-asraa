# PROMPTS.md — what to paste into Claude Code

Use one prompt per Claude Code session, in order. Start a new session for each milestone. Each prompt assumes Claude Code has read `CLAUDE.md` (it does this automatically).

Before pasting, check the **Needs** line: if a credential isn't in `.env` yet, Claude Code builds what it can and tells you what's missing.

---

## A0a — Scaffold (no credentials needed)

**Needs:** nothing.

```
Do milestone A0a from BUILD_PLAN.md.

Read AGENTS.md, BUILD_PLAN.md (A0), docs/PRD.md, migrations/0001_init.sql and schemas/receipt_extraction.schema.json first.

Set up git, .gitignore, .gitattributes and the folder layout. Create the Rust backend in backend/ with axum, tokio, sqlx, serde, tracing and the other crates from AGENTS.md section 2, using cargo add for current versions. Build Config (fails fast at startup with a clear list of missing variables, but cargo build and cargo test must work without a .env), JSON logging, and GET /health.

Write ai/receipt.rs: serde types matching the receipt schema exactly, and the pure validation function from AGENTS.md section 7, with unit tests for: a good receipt, totals off by more than 1 EGP, confidence below 0.6, blurry/cut_off issues, and not a receipt. Money as rust_decimal::Decimal.

Add .github/workflows/ci.yml (fmt, clippy -D warnings, test). Create docs/STATUS.md.

Do not connect to any database or external service in this milestone. When done, run fmt, clippy and tests, commit, and give me the exact list of .env variables I need to fill in for A0b.
```

---

## A0b — Connect Supabase and deploy

**Needs:** `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in `.env`. For the deploy part: `gcloud auth login` done and a Google Cloud project with billing.

```
Do milestone A0b from BUILD_PLAN.md.

First, read-only: connect with DATABASE_URL and report what already exists in the Supabase database (tables, enums, storage buckets, row counts) compared with migrations/0001_init.sql. Follow the three cases in BUILD_PLAN.md A0b exactly. If the database has a different schema, stop and show me the differences before changing anything.

Then make /health check the database for real, and add the Dockerfile (multi-stage, non-root, listens on $PORT). Test the container locally if Docker is available.

For Cloud Run: show me the exact gcloud commands (Artifact Registry, Secret Manager secrets, Cloud Run service in europe-west3 with min instances 1 and CPU always allocated) and wait for my go-ahead before running them. After deploy, add the deploy job to CI.
```

---

## A1 — WhatsApp in and out

**Needs:** `WHAPI_API_URL`, `WHAPI_TOKEN`, `WHAPI_WEBHOOK_SECRET` (any long random string you make up). A test phone.

```
Do milestone A1 from BUILD_PLAN.md.

Before writing any parser: read Whapi's current official docs for webhooks, sending text and downloading media. Then give me a short step-by-step for capturing real webhook payloads (text, image, image with caption, voice note, reply, group message) into fixtures/whapi/, with phone numbers replaced by fake ones. Build the serde types from those captured files only.

Then build the webhook route with the secret check, wa_messages logging, wa_message_id idempotency, immediate 200 and background processing with tokio::spawn, the WhatsAppGateway trait with a WhapiClient implementation, the outbound rate limit, and a temporary "Got it" reply. Include fixture tests and a test that a replayed webhook creates one row and one reply.

Tell me exactly how to point the Whapi webhook at the service (local tunnel for testing, then the Cloud Run URL).
```

---

## A2 — Onboarding

**Needs:** nothing new.

```
Do milestone A2 from BUILD_PLAN.md.

Create locales/en.toml and locales/ar.toml starting from the starter bot copy in the BUILD_PLAN.md appendix (Arabic stays Egyptian dialect), and i18n.rs that fails at startup if a key exists in one language but not the other. Add migration 0002_onboarding_step.sql for users.onboarding_step and show it to me before applying it.

Build the onboarding flow exactly as in AGENTS.md section 8 and BUILD_PLAN.md A2, including resuming halfway, username validation with suggestions, budget parsing for "5000", "5,000", "٥٠٠٠" and "5k", and creating the family with the user as owner. Keep the step logic as pure functions with unit tests.
```

---

## A3 — Receipt reading (photos)

**Needs:** `ANTHROPIC_API_KEY`, `CLAUDE_RECEIPT_MODEL` (start with `claude-haiku-5-5`). 20 receipt photos for the accuracy test.

```
Do milestone A3 from BUILD_PLAN.md.

Check Anthropic's current docs for structured outputs (output_config.format with json_schema) and image input before writing the client. Build ai/claude.rs over plain HTTP with reqwest, following AGENTS.md section 7 exactly: system prompt from prompts/receipt_system.md, schema from schemas/receipt_extraction.schema.json, stop_reason handling, retries with backoff, image resized to max 1568 px on the long edge.

Wire it into the bot: download image, upload to the private receipts bucket, create the receipts row, call Claude, validate in Rust, save store/items, reply with the confirmation from the locale files, or ask for a clearer photo. Add corrections ("the total was 450").

Then set up the accuracy test behind --features live-ai: tell me how to lay out my 20 receipts and their expected JSON in fixtures/receipts/, run both claude-haiku-5-5 and claude-sonnet-5-5, and write the comparison to docs/receipt-accuracy.md so we can pick the model.
```

---

## A4 — Voice notes and typed purchases

**Needs:** Google Speech-to-Text API enabled; `STT_PROVIDER=google` and credentials (or Cloud Run's service account).

```
Do milestone A4 from BUILD_PLAN.md.

Check Google Cloud Speech-to-Text's current docs for Egyptian Arabic (ar-EG) with an English alternative and for the audio format WhatsApp voice notes use. Build stt.rs, store voice notes in the voice-notes bucket and transcripts in receipts.transcript, and send transcripts and typed purchases through the same Claude extraction and validation as photos.

Build bot/router.rs: keyword shortcuts first for obvious commands, then a small Claude call with strict JSON output for intent (purchase, spending question, family command, memory command, correction, small talk). Include tests that "how much did I spend?" is never saved as a purchase.
```

---

## A5 — Product matching and prices

**Needs:** nothing new; an `ADMIN_PASSWORD` in `.env` for the review page.

```
Do milestone A5 from BUILD_PLAN.md.

Build matching.rs in the order barcode → store alias → global alias → pg_trgm similarity (auto-match only above 0.75), with Arabic normalisation (أ إ آ → ا, ة → ه, ى → ي, remove diacritics and tatweel, Arabic-Indic digits to Western). Create unverified products and aliases when nothing matches, and insert prices for matched lines with a known store. Never put user data in prices.

Add a minimal internal review page (server-rendered HTML from axum, protected by ADMIN_PASSWORD) to confirm or change unmatched and low-score lines. Unit-test the normaliser thoroughly.
```

---

## A6 — Family

```
Do milestone A6 from BUILD_PLAN.md: invites by username or phone in both languages, accept/decline, the one-active-family rule with a friendly explanation, owner-only invite/remove, "leave family", and receipts saved with the user's current family_id. Tests for every rule.
```

---

## A7 — Spending summaries

```
Do milestone A7 from BUILD_PLAN.md: on-demand questions by week, month, category and store in both languages; the monthly status line; the weekly summary (Friday morning Cairo time, only inside the 24-hour window, otherwise held until the user's next message); the monthly report on the 1st. Scheduled jobs are protected internal endpoints for Cloud Scheduler, not in-process timers; show me the Cloud Scheduler commands before creating anything. One number-formatting helper for EGP in both languages. Add a test that compares summary totals with a direct SQL sum, and one that running the weekly job twice sends nothing the second time.
```

---

## A8 — Memory

```
Do milestone A8 from BUILD_PLAN.md: detect reasons and facts and save memory_notes with kind, category and applies_until; "what do you remember?" in both languages; "forget 2" and "forget the birthday"; pass active notes into the Claude calls that answer questions. Include a test that notes never leak between users or families.
```

---

## A9 — Overspend alerts

```
Do milestone A9 from BUILD_PLAN.md: after each saved receipt, check the 80% and 100% thresholds (family and category budgets) and the unusual-receipt rule (more than 3x the family's median over 60 days, at least 5 receipts); suppress with suppressed_by when an active memory note covers it; rely on the unique index for once-per-month. Write the alert rules as pure functions with unit tests, and copy that is warm and includes days left and one practical tip.
```

---

## A10 — Hardening and pilot launch

```
Do milestone A10 from BUILD_PLAN.md: friendly messages on every failure path, Cloud Monitoring alerts on error rate and webhook failures (show me the commands first), a daily processing summary, "delete my data" with confirmation (user, Storage files and messages), a load check of 50 receipts in 5 minutes, and docs/RUNBOOK.md (deploy, roll back, rotate keys, re-run a failed receipt, what to do if the Whapi number is banned). Then go through the MVP finish line in BUILD_PLAN.md and report which boxes are ticked and what is still open.
```

---

## When something breaks

```
Something is wrong: <describe what you did and what happened>.
Get the real error first (logs, the failing request, the exact response) before changing code. Tell me the cause in one or two sentences, then fix it with a test that would have caught it.
```
