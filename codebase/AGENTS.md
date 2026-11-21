# AGENTS.md — Wafar Asraa (وفّر أسرة)

Instructions for any AI coding agent (Claude Code, Cursor, Codex, Windsurf…) working in this repo. Read this whole file before writing code.

## 1. What we are building

Wafar Asraa is an AI money assistant for Egyptian families in Cairo and Giza. **MVP = a WhatsApp bot** that:

1. **Reads receipts.** A photo, voice note or text → structured purchase saved to the database.
2. **Summarises spending.** On demand, weekly and monthly, by category and store.
3. **Remembers.** It saves facts and reasons the user gives ("this month is high because of a birthday") and uses them.
4. **Sends overspend alerts.** At 80% and 100% of the monthly budget, and for unusual receipts. No alert repeats for a reason the user already gave.

The full product spec is the PRD (`docs/PRD.md`, exported from the team doc). If this file and the PRD disagree on scope, the PRD wins. Ask before building anything outside the four features above.

**`BUILD_PLAN.md` is the step-by-step order of work** (milestones, tasks, checks and the MVP finish line). Follow it in order.

Alongside the bot, `app/` holds an **investor prototype** (Expo). It reads real receipts and spending, but shopping, price comparison and checkout run on clearly labelled sample data and never place real orders. See `BUILD_PLAN.md` Part B.

**Out of scope for v1, do not build:** real ordering, payments or delivery, the wallet, savings goals, live price comparison for users, store partner portal, flyer reading, café suggestions.

## 2. Stack (decided, do not swap)

| Layer | Choice |
| --- | --- |
| Language | **Rust**, stable toolchain, edition 2021 |
| HTTP server | `axum` + `tokio` |
| Database | Supabase Postgres via `sqlx` (Postgres, `runtime-tokio`, `tls-rustls`, `uuid`, `chrono`, `rust_decimal`, `json`, `migrate`) |
| File storage | Supabase Storage REST API via `reqwest` (buckets `receipts`, `voice-notes`, both private) |
| AI: receipts and text | Claude Messages API over HTTP with `reqwest` (no official Rust SDK; do not add unofficial SDK crates) |
| AI: voice notes | Speech-to-text first (provider in `STT_PROVIDER`; default Google Cloud Speech-to-Text, language `ar-EG` with `en-US` alternative), then the transcript goes to Claude like a text purchase |
| WhatsApp | Whapi (unofficial gateway) via `reqwest`. Will move to Meta Cloud API later, so keep it behind a trait |
| Serialisation | `serde`, `serde_json` |
| Errors and logs | `thiserror` in library code, `anyhow` at the edges, `tracing` + `tracing-subscriber` (JSON logs) |
| Money | `rust_decimal::Decimal`. **Never `f32`/`f64` for money** |
| Hosting | Google Cloud Run, region `europe-west3` (Frankfurt, same as Supabase), Docker image built from `backend/Dockerfile` |
| Mobile app (later) | React Native + Expo in `app/`, same Supabase project |

## 3. Repo layout

```
wafar-asraa/
├── AGENTS.md                 ← this file
├── docs/
│   └── PRD.md                ← product spec (source of truth for scope)
├── migrations/
│   └── 0001_init.sql         ← full Supabase schema; new changes = new numbered file
├── schemas/
│   └── receipt_extraction.schema.json   ← JSON schema Claude must return
├── prompts/
│   └── receipt_system.md     ← system prompt for receipt reading
├── locales/
│   ├── en.toml               ← every bot message in English
│   └── ar.toml               ← every bot message in Egyptian Arabic
├── fixtures/
│   ├── receipts/             ← real sample receipt photos + expected JSON
│   └── whapi/                ← real captured webhook payloads
├── backend/
│   ├── Cargo.toml
│   ├── Dockerfile
│   └── src/
│       ├── main.rs           ← config, tracing, router, server start
│       ├── config.rs         ← env vars → typed Config (fail fast if missing)
│       ├── routes/
│       │   ├── whapi.rs      ← POST /webhooks/whapi
│       │   └── health.rs     ← GET /health
│       ├── whatsapp/         ← trait WhatsAppGateway + WhapiClient impl
│       ├── ai/
│       │   ├── claude.rs     ← Messages API client, structured output call
│       │   ├── receipt.rs    ← Receipt types (serde) matching the schema
│       │   └── stt.rs        ← speech-to-text
│       ├── bot/
│       │   ├── router.rs     ← decides what an inbound message is (receipt, question, command, onboarding)
│       │   ├── onboarding.rs
│       │   ├── receipts.rs
│       │   ├── summaries.rs
│       │   ├── memory.rs
│       │   ├── alerts.rs
│       │   └── family.rs     ← invites, "add @username"
│       ├── db/               ← all SQL lives here, one module per table group
│       ├── matching.rs       ← receipt line → product (barcode, alias, fuzzy)
│       └── i18n.rs           ← loads locales/*.toml
└── app/                      ← Expo app (Phase 1b, not now)
```

Keep business rules (budgets, alerts, memory) in plain functions that take data and return decisions, so they can be unit-tested without a database or network.

## 4. Environment variables

All secrets come from env vars (Cloud Run secrets in production, `.env` locally — `.env` is git-ignored). Never hard-code or log them.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase Postgres connection string. Use the **session pooler (port 5432)** or the direct connection, not the transaction pooler (6543): sqlx prepared statements break on transaction pooling |
| `SUPABASE_URL` | Project URL, for Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend-only key. Bypasses row-level security. Never ship it to the app |
| `ANTHROPIC_API_KEY` | Claude API key |
| `CLAUDE_RECEIPT_MODEL` | Model id for receipts, e.g. `claude-haiku-5-5` or `claude-sonnet-5-5` (chosen after the accuracy test) |
| `CLAUDE_CHAT_MODEL` | Model id for understanding free-text questions and memory |
| `WHAPI_API_URL` | Whapi base URL |
| `WHAPI_TOKEN` | Whapi channel token |
| `WHAPI_WEBHOOK_SECRET` | Random string. If Whapi cannot sign webhooks, put it in the webhook path (`/webhooks/whapi/{secret}`) and reject anything else |
| `STT_PROVIDER` | `google` (default) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Only if STT is Google and not using Cloud Run's service account |
| `APP_ENV` | `local` / `staging` / `production` |
| `RUST_LOG` | e.g. `info,wafar=debug` |
| `PORT` | Set by Cloud Run; default 8080 |

Keep `.env.example` up to date with every variable (no values).

## 5. Database rules

- The schema is `migrations/0001_init.sql`. Read it before writing any query.
- **Never edit an applied migration.** Every schema change is a new file `migrations/000N_description.sql`, and you say in your summary why it was needed.
- All SQL goes in `backend/src/db/`. Use `sqlx::query!` / `query_as!` (compile-time checked). Run `cargo sqlx prepare` and commit `.sqlx/` so CI builds offline.
- The backend uses the service-role connection, so RLS does not protect you: **every query that reads user data must filter by `user_id` or `family_id` explicitly.**
- Money columns are `numeric(12,2)` ↔ `Decimal`. Dates on receipts ↔ `chrono::NaiveDate`; timestamps ↔ `DateTime<Utc>`. Display times in `Africa/Cairo`.
- Store raw AI output in `receipts.ai_raw` (jsonb) so receipts can be re-parsed later.
- Every receipt line that is saved with a matched `product_id` and a `store_id` also inserts a row into `prices` with `source = 'receipt'`.

## 6. WhatsApp (Whapi) rules

1. **Before writing the webhook parser, capture real payloads.** Send a text, an image, a voice note and a reply from a test phone, save each raw JSON body to `fixtures/whapi/`, and build the serde types from those files. Do not write types from memory or guesswork; read Whapi's official docs for field meanings.
2. The webhook returns `200` immediately after: verifying the secret, logging the message to `wa_messages`, and checking `wa_message_id` is new. Processing (download media, call AI, reply) runs in a background task (`tokio::spawn`). Cloud Run must use **instance-based billing (CPU always allocated) with min instances = 1** so background tasks are not frozen.
3. **Idempotency:** `wa_message_id` is unique in `wa_messages` and `receipts`. A duplicate delivery must do nothing.
4. Ignore messages from groups, status updates, and our own outbound messages.
5. Outbound messages go through the `WhatsAppGateway` trait only, never by calling Whapi directly from bot logic.
6. **Reply-first messaging:** proactive messages (weekly summary, alerts) are sent only to users who messaged us in the last 24 hours, otherwise they wait until the user's next message. This keeps costs low on the official API later and lowers ban risk on Whapi now.
7. Rate-limit outbound sends (at most 1 message per second per number, short random delay). Never broadcast.
8. No links in proactive messages. The bot never asks for bank, card or ID details.

## 7. Receipt reading with Claude

- Call `POST https://api.anthropic.com/v1/messages` with headers `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json`.
- System prompt: `prompts/receipt_system.md` (load it at startup).
- Force the output shape with structured outputs:
  `"output_config": { "format": { "type": "json_schema", "schema": <schemas/receipt_extraction.schema.json minus the $comment key> } }`.
  The JSON comes back in the first `text` content block; parse it with `serde_json` into `ai::receipt::Receipt`.
- **Check `stop_reason` before parsing.** `"max_tokens"` → retry once with a higher `max_tokens`; `"refusal"` → mark receipt `failed` and ask the user to resend.
- If the API rejects a schema keyword, fix the schema (for example, turn `"type": ["string","null"]` into `anyOf`) and keep `schemas/` and `receipt.rs` in sync. Never drop to "parse whatever JSON comes back".
- Images: WhatsApp sends JPEG. Resize so the long edge is at most 1568 px before sending (saves tokens without losing legibility), send as base64 `image` content block.
- After parsing, **validate in Rust**, don't trust the model:
  - `sum(line_total) − sum(discount) − discount_total + tax_total` within 1 EGP of `total`, else add `total_mismatch` and set status `needs_review`.
  - `confidence < 0.6` or `issues` contains `blurry`, `cut_off`, `total_not_readable` → ask the user for a clearer photo instead of saving a guess.
  - `is_receipt == false` → friendly reply explaining what to send.
- Voice notes: STT → transcript stored in `receipts.transcript` → same Claude call with the transcript as text.
- Keep a fixture test per sample in `fixtures/receipts/`: the expected JSON must deserialize and pass validation. Live API tests are behind `--features live-ai` and never run in CI by default.

## 8. Bot behaviour

- **Language:** reply in the user's chosen language (`users.language`). Arabic means **Egyptian dialect**, friendly and short, not formal MSA. All user-facing text lives in `locales/en.toml` and `locales/ar.toml`; no user-facing strings in Rust code.
- **Tone:** warm, direct, never shaming. "You've used 85% of this month's budget with 9 days left" not "You overspent!".
- Messages are short (mobile screen), minimal emoji, numbers formatted as `1,250 EGP` / `١٬٢٥٠ جنيه`.
- **Onboarding order:** language → first name → username (`^[a-z0-9_]{3,30}$`, unique) → family size → monthly budget (optional) → one message explaining "send a receipt photo or a voice note after shopping". Creating the user also creates their family with them as `owner`.
- **Family:** one person signs up and adds others by username or phone ("add @mona"). The invitee must accept. A user is active in one family at a time.
- **Memory:** when a user explains a spend, save a `memory_notes` row (`kind = 'overspend_reason'`, `applies_until` = end of that month unless they say otherwise). "What do you remember?" lists active notes; "forget …" sets `active = false`.
- **Alerts:** check after every saved receipt. Use the unique index on `alerts` to guarantee one alert per type per month. If an active memory note covers the period/category, record the alert with `suppressed_by` and don't send it.
- **Corrections:** a reply like "the total was 450" updates the latest receipt and sets `user_corrected = true`.

## 9. Privacy and security

- Receipts and voice notes are personal data. Storage buckets stay private; use signed URLs if anything ever needs to show them.
- Logs: mask phone numbers (`+2010****4567`), never log message bodies, transcripts or images at `info` level.
- Prices in `prices` are shared and contain no personal data. Never put `user_id` there.
- Delete-my-data must be possible: deleting a user cascades to their receipts, memory notes and alerts (the schema already does this).

## 10. How to work

- Work in **small steps**: one feature or module per change, with tests, then stop and summarise what changed and what to test manually.
- **Research before building.** Before integrating any external API (Whapi, Claude, STT, Supabase Storage), read its current docs and capture a real response. Get the real error before guessing at a fix.
- Before finishing any change, run and pass:
  ```
  cargo fmt --all
  cargo clippy --all-targets -- -D warnings
  cargo test
  cargo sqlx prepare --check
  ```
- Don't add dependencies without saying why. Prefer well-maintained crates.
- If something in the PRD is unclear or two rules conflict, stop and ask instead of choosing silently.
- Never commit secrets, `.env`, real customer receipts, or real phone numbers. Fixture receipts must be our own or anonymised.

## 11. Definition of done for the MVP

- [ ] A new user can onboard fully on WhatsApp in English or Arabic.
- [ ] A clear receipt photo is saved with store, date, items and total, and the user gets a confirmation within 20 seconds.
- [ ] A blurry photo gets a polite "please send a clearer photo" instead of a wrong save.
- [ ] Voice notes and typed purchases are saved.
- [ ] "How much did I spend this month?" returns totals by category and store.
- [ ] Budget alerts fire once at 80% and once at 100%, and stay quiet when a saved reason covers them.
- [ ] Family owner can add a member, and the member's receipts count toward the family budget.
- [ ] Duplicate webhook deliveries never create duplicate receipts.
- [ ] Runs on Cloud Run with logs, `/health`, and secrets from Secret Manager.
