# AGENTS.md — Wafar Asraa (وفّر أسرة)

Instructions for any AI coding agent (Claude Code, Cursor, Codex, Windsurf…) working in this repo. Read this whole file before writing code.

## 1. What we are building

Wafar Asraa is an AI money assistant for Egyptian families in Cairo and Giza. **MVP = a WhatsApp bot** that:

1. **Reads receipts.** A photo, voice note or text → structured purchase saved to the database.
2. **Summarises spending.** On demand, weekly and monthly, by category and store.
3. **Remembers.** It saves facts and reasons the user gives ("this month is high because of a birthday") and uses them.
4. **Sends overspend alerts.** At 80% and 100% of the monthly budget, and for unusual receipts. No alert repeats for a reason the user already gave.

The product spec is `docs/PRD.md`. If this file and the PRD disagree on scope, the PRD wins. Ask before building anything outside the four features above.

**`BUILD_PLAN.md` is the step-by-step order of work** (milestones, tasks, checks and the MVP finish line). **This repo builds Part A only** (milestones A0–A10). Follow them in order.

**This repo is the backend.** It serves the WhatsApp bot now and the mobile app later (same database, same rules). The investor demo is a separate Vite + React web app in another folder: do not create, copy or edit any frontend code here. When the backend later needs endpoints for the app, `docs/APP_UI_PRD.md` describes what the app shows.

**Supabase already exists.** The project is created and credentials go in `.env` (never committed). Do not create another project. See `BUILD_PLAN.md` A0 for how to check the existing database against `migrations/0001_init.sql` before touching it.

**Out of scope for v1, do not build:** real ordering, payments or delivery, the wallet, savings goals, live price comparison for users, store partner portal, flyer reading, café suggestions.

## 2. Stack (decided, do not swap)

The backend is **TypeScript for now**. A move to Rust may come later; §12 lists the rules that keep that move cheap. Follow them from day one.

| Layer | Choice |
| --- | --- |
| Language | **TypeScript**, `strict: true`, ES modules, Node.js **24 LTS or newer** (`"engines": { "node": ">=24" }`) |
| Package manager | `npm` (commit `package-lock.json`) |
| HTTP server | `hono` + `@hono/node-server` |
| Database | Supabase Postgres via `pg` (node-postgres) + `kysely` (typed SQL query builder). Table types generated from the live database with `kysely-codegen` |
| Migrations | Plain SQL files in `migrations/`, applied by `backend/scripts/migrate.ts` (records each file and its checksum in a `schema_migrations` table). No ORM-owned migrations |
| File storage | Supabase Storage via `@supabase/supabase-js`, **storage only** (buckets `receipts`, `voice-notes`, both private). All database access goes through Kysely, not supabase-js |
| AI: receipts and text | Claude Messages API via the official `@anthropic-ai/sdk` |
| AI: voice notes | Speech-to-text first (provider in `STT_PROVIDER`; default Google Cloud Speech-to-Text via `@google-cloud/speech`, language `ar-EG` with `en-US` alternative), then the transcript goes to Claude like a text purchase |
| WhatsApp | Whapi (unofficial gateway) via native `fetch`. Will move to Meta Cloud API later, so keep it behind the `WhatsAppGateway` interface |
| Validation | `zod` for **every** outside input: env vars, webhook bodies, Claude output, API responses |
| Images | `sharp` (resize before sending to Claude) |
| Errors and logs | Typed error classes (`AppError` subclasses) in library code, caught at route and job edges. `pino` for JSON logs |
| Money | **Integer piastres** (`1 EGP = 100`), held in a `number` that is always an integer, through the helpers in `src/lib/money.ts`. **Never do arithmetic on EGP as a decimal `number`**. Same convention as the investor demo |
| Tests | `vitest` |
| Format and lint | `biome` (one tool for both) |
| Hosting | Google Cloud Run, region `europe-west3` (Frankfurt, same as Supabase), Docker image built from `backend/Dockerfile` |
| App clients (not in this repo) | Investor web demo (Vite + React) now; production mobile app (React Native / Expo) later. Both talk to this backend and the same Supabase project |

## 3. Repo layout

```
wafar-backend/
├── CLAUDE.md                 ← Claude Code entry point (imports this file)
├── AGENTS.md                 ← this file
├── BUILD_PLAN.md             ← milestones A0–A10
├── PROMPTS.md                ← the prompt to paste for each milestone
├── docs/
│   ├── PRD.md                ← product spec (source of truth for scope)
│   ├── APP_UI_PRD.md         ← app screens, for future app endpoints only
│   └── STATUS.md             ← progress log, updated at the end of every milestone
├── migrations/
│   └── 0001_init.sql         ← full Supabase schema; new changes = new numbered file
├── schemas/
│   └── receipt_extraction.schema.json   ← JSON schema Claude must return
├── prompts/
│   └── receipt_system.md     ← system prompt for receipt reading
├── locales/
│   ├── en.json               ← every bot message in English
│   └── ar.json               ← every bot message in Egyptian Arabic
├── fixtures/
│   ├── receipts/             ← real sample receipt photos + expected JSON
│   ├── whapi/                ← real captured webhook payloads
│   └── rules/                ← shared test cases for the pure rules (see §12)
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── biome.json
│   ├── Dockerfile
│   ├── scripts/
│   │   └── migrate.ts        ← applies migrations/*.sql in order
│   └── src/
│       ├── main.ts           ← config, logger, app, server start
│       ├── config.ts         ← env vars → typed Config via zod (fail fast if missing)
│       ├── routes/
│       │   ├── whapi.ts      ← POST /webhooks/whapi/:secret
│       │   └── health.ts     ← GET /health
│       ├── whatsapp/         ← WhatsAppGateway interface + WhapiClient
│       ├── ai/
│       │   ├── claude.ts     ← Messages API client, structured output call
│       │   ├── receipt.ts    ← Receipt zod schema + types matching the JSON schema
│       │   └── stt.ts        ← speech-to-text
│       ├── bot/              ← I/O: reads data, calls rules, sends replies
│       │   ├── router.ts     ← decides what an inbound message is (receipt, question, command, onboarding)
│       │   ├── onboarding.ts
│       │   ├── receipts.ts
│       │   ├── summaries.ts
│       │   ├── memory.ts
│       │   ├── alerts.ts
│       │   └── family.ts     ← invites, "add @username"
│       ├── rules/            ← PURE decision logic, no I/O (see below and §12)
│       ├── db/               ← all SQL lives here, one module per table group
│       │   └── schema.generated.ts   ← kysely-codegen output, committed
│       ├── lib/
│       │   └── money.ts      ← piastres helpers: parse, convert, format
│       ├── matching.ts       ← receipt line → product (barcode, alias, fuzzy)
│       └── i18n.ts           ← loads locales/*.json
└── .github/workflows/ci.yml  ← format, lint, typecheck, test
```

Keep business rules (receipt validation, budgets, alerts, memory, money parsing, username checks, Arabic name normalisation) in `src/rules/` as plain functions that take data and return decisions. They import nothing from Node, the database or the network, so they can be unit-tested alone, shared with the mobile app later, and ported to Rust one file at a time.

## 4. Environment variables

All secrets come from env vars (Cloud Run secrets in production, `.env` locally — `.env` is git-ignored). Never hard-code or log them.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase Postgres connection string. Use the **session pooler (port 5432)** or the direct connection, not the transaction pooler (6543): this is a long-running server with its own pool, and a later Rust/sqlx version needs session mode for prepared statements |
| `SUPABASE_URL` | Project URL, for Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend-only key. Bypasses row-level security. Never ship it to the app |
| `ANTHROPIC_API_KEY` | Claude API key |
| `CLAUDE_RECEIPT_MODEL` | Model id for receipts, e.g. `claude-haiku-5-5` or `claude-sonnet-5-5` (chosen after the accuracy test) |
| `CLAUDE_CHAT_MODEL` | Model id for understanding free-text questions and memory |
| `WHAPI_API_URL` | Whapi base URL |
| `WHAPI_TOKEN` | Whapi channel token |
| `WHAPI_WEBHOOK_SECRET` | Random string. If Whapi cannot sign webhooks, put it in the webhook path (`/webhooks/whapi/:secret`) and reject anything else |
| `STT_PROVIDER` | `google` (default) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Only if STT is Google and not using Cloud Run's service account |
| `ADMIN_PASSWORD` | Protects the internal product-matching review page (from A5) |
| `APP_ENV` | `local` / `staging` / `production` |
| `LOG_LEVEL` | `pino` level, e.g. `info` or `debug` |
| `PORT` | Set by Cloud Run; default 8080 |

Keep `.env.example` up to date with every variable (no values). Locally, load `.env` with Node's built-in `--env-file=.env` (no `dotenv` package).

## 5. Database rules

- The schema is `migrations/0001_init.sql`. Read it before writing any query.
- **Never edit an applied migration.** Every schema change is a new file `migrations/000N_description.sql`, and you say in your summary why it was needed.
- All SQL goes in `backend/src/db/`, written with Kysely so queries are type-checked against `schema.generated.ts`. After every migration, regenerate it (`npm run db:types`) and commit it so CI type-checks without a database. Before credentials exist (start of A0), write `schema.generated.ts` by hand from `0001_init.sql` so the project still compiles; regenerate it in A0b.
- Raw SQL (`sql` template tag) is fine where Kysely is awkward (e.g. `pg_trgm` similarity). Never build SQL by string concatenation.
- The backend uses the service-role connection, so RLS does not protect you: **every query that reads user data must filter by `user_id` or `family_id` explicitly.**
- Type mapping: `numeric(12,2)` comes back from `pg` as a **string**; convert it to piastres with `money.ts` (string parsing, never `parseFloat`). `date` columns stay as `'YYYY-MM-DD'` strings (set a `pg` type parser so they are not turned into `Date`). `timestamptz` ↔ `Date` in UTC. Display times in `Africa/Cairo` using `Intl.DateTimeFormat` with `timeZone: 'Africa/Cairo'`.
- Store raw AI output in `receipts.ai_raw` (jsonb) so receipts can be re-parsed later.
- Every receipt line that is saved with a matched `product_id` and a `store_id` also inserts a row into `prices` with `source = 'receipt'`.

## 6. WhatsApp (Whapi) rules

1. **Before writing the webhook parser, capture real payloads.** Send a text, an image, a voice note and a reply from a test phone, save each raw JSON body to `fixtures/whapi/`, and build the zod schemas from those files. Do not write types from memory or guesswork; read Whapi's official docs for field meanings.
2. The webhook returns `200` immediately after: verifying the secret, logging the message to `wa_messages`, and checking `wa_message_id` is new. Processing (download media, call AI, reply) runs in the background **without awaiting it in the request** (a `processInBackground()` helper that starts the work and catches and logs every error, so a failure never becomes an unhandled rejection). Cloud Run must use **instance-based billing (CPU always allocated) with min instances = 1** so background work is not frozen.
3. **Idempotency:** `wa_message_id` is unique in `wa_messages` and `receipts`. A duplicate delivery must do nothing.
4. Ignore messages from groups, status updates, and our own outbound messages.
5. Outbound messages go through the `WhatsAppGateway` interface only, never by calling Whapi directly from bot logic.
6. **Reply-first messaging:** proactive messages (weekly summary, alerts) are sent only to users who messaged us in the last 24 hours, otherwise they wait until the user's next message. This keeps costs low on the official API later and lowers ban risk on Whapi now.
7. Rate-limit outbound sends (at most 1 message per second per number, short random delay). Never broadcast.
8. No links in proactive messages. The bot never asks for bank, card or ID details.

## 7. Receipt reading with Claude

- Use the official `@anthropic-ai/sdk` (`client.messages.create`). Check the current docs for structured outputs before writing the call.
- System prompt: `prompts/receipt_system.md` (load it at startup).
- Force the output shape with structured outputs:
  `output_config: { format: { type: "json_schema", schema: <schemas/receipt_extraction.schema.json minus the $comment key> } }`.
  The JSON comes back in the first `text` content block; `JSON.parse` it, then parse it with the zod `ReceiptSchema` in `ai/receipt.ts`. A zod failure is an error, never "use whatever came back".
- `schemas/receipt_extraction.schema.json` is the source of truth. `ai/receipt.ts` must match it exactly; a test checks the zod schema accepts every expected JSON in `fixtures/receipts/` and rejects a few broken ones.
- **Check `stop_reason` before parsing.** `"max_tokens"` → retry once with a higher `max_tokens`; `"refusal"` → mark receipt `failed` and ask the user to resend.
- If the API rejects a schema keyword, fix the schema (for example, turn `"type": ["string","null"]` into `anyOf`) and keep `schemas/` and `receipt.ts` in sync.
- Images: WhatsApp sends JPEG. Resize with `sharp` so the long edge is at most 1568 px before sending (saves tokens without losing legibility), send as a base64 `image` content block.
- Convert every money value from Claude to piastres right after parsing (`toPiastres` in `money.ts`), then **validate in code** (`src/rules/receiptValidation.ts`), don't trust the model:
  - **Photos:** let `net = sum(line_total) − sum(discount) − discount_total`. The receipt passes if `net` **or** `net + tax_total` is within 1 EGP (100 piastres) of `total`, else add `total_mismatch` and set status `needs_review`. Both are allowed because Egyptian chains usually print shelf prices that already include 14% VAT and show the VAT as an informational line; adding it again would flag almost every chain receipt.
  - **Voice and text:** the amount the user said is the truth. If `total` is present, a line-sum mismatch is **not** flagged (people often give one amount for several things). If `total` is `null` but every item has a `line_total`, use `net` as the total.
  - `total` is `null` on a photo → treat as `total_not_readable`.
  - `confidence < 0.6` or `issues` contains `blurry`, `cut_off`, `total_not_readable` → ask the user for a clearer photo instead of saving a guess.
  - `is_receipt == false` → friendly reply explaining what to send.
- Voice notes: STT → transcript stored in `receipts.transcript` → same Claude call with the transcript as text.
- Keep a fixture test per sample in `fixtures/receipts/`: the expected JSON must parse and pass validation. Live API tests run only with `LIVE_AI=1` (`npm run test:live`) and never in CI by default.

## 8. Bot behaviour

- **Language:** reply in the user's chosen language (`users.language`). Arabic means **Egyptian dialect**, friendly and short, not formal MSA. All user-facing text lives in `locales/en.json` and `locales/ar.json`; no user-facing strings in TypeScript code.
- **Tone:** warm, direct, never shaming. "You've used 85% of this month's budget with 9 days left" not "You overspent!".
- Messages are short (mobile screen), minimal emoji, numbers formatted as `1,250 EGP` / `١٬٢٥٠ جنيه`.
- **Onboarding order:** language → first name → username (`^[a-z0-9_]{3,30}$`, unique) → family size → monthly budget (optional) → one message explaining "send a receipt photo or a voice note after shopping". Creating the user also creates their family with them as `owner`.
- **Family:** one person signs up and adds others by username or phone ("add @mona"). The invitee must accept. A user is active in one family at a time.
- **Memory:** when a user explains a spend, save a `memory_notes` row (`kind = 'overspend_reason'`, `applies_until` = end of that month unless they say otherwise). "What do you remember?" lists active notes; "forget …" sets `active = false`.
- **Alerts:** check after every saved receipt. Use the unique index on `alerts` to guarantee one alert per type per month. If an active memory note covers the period/category, record the alert with `suppressed_by` and don't send it.
- **Corrections:** a reply like "the total was 450" updates the latest receipt and sets `user_corrected = true`.

## 9. Privacy and security

- Receipts and voice notes are personal data. Storage buckets stay private; use signed URLs if anything ever needs to show them.
- Logs: mask phone numbers (`+2010****4567`), never log message bodies, transcripts or images at `info` level. Configure `pino` redaction for known secret and phone fields.
- Prices in `prices` are shared and contain no personal data. Never put `user_id` there.
- Delete-my-data must be possible. Deleting a user cascades to their receipts, memory notes and alerts, but the schema does **not** cover everything: a family owner can't be deleted while `families.owner_id` points at them (`on delete restrict`), and `wa_messages` keeps the phone and bodies (`on delete set null`). The delete flow handles both in code; see `BUILD_PLAN.md` A10.

## 10. How to work

- Work in **small steps**: one feature or module per change, with tests, then stop and summarise what changed and what to test manually.
- **One milestone per session.** Finish the milestone you were given, tick its boxes in `BUILD_PLAN.md`, add an entry to `docs/STATUS.md` (date, milestone, what was built, how to test by hand, open issues), commit, and stop. Never start the next milestone without being asked.
- **The developer works on Windows** in VS Code. Give shell commands that work in PowerShell, and keep line endings consistent (`.gitattributes` with `* text=auto eol=lf`).
- **Missing credentials are not a blocker for writing code.** If a step needs a key that isn't in `.env` yet, build and unit-test everything that doesn't need it, then list exactly which variables are needed and stop. Never invent, hard-code or ask the user to paste secrets into chat.
- **Research before building.** Before integrating any external API (Whapi, Claude, STT, Supabase Storage), read its current docs and capture a real response. Get the real error before guessing at a fix.
- Before finishing any change, run and pass (from `backend/`):
  ```
  npm run check
  ```
  which runs `biome format` (check mode), `biome lint`, `tsc --noEmit` and `vitest run`. No `any`, no `@ts-ignore`, no `eslint-disable`-style escapes without a comment explaining why.
- Don't add dependencies without saying why. Prefer well-maintained packages with types included.
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

## 12. Keeping a future Rust move cheap

The backend may be rewritten in Rust later. These rules make that a port, not a redesign. Follow them now.

1. **Language-neutral sources of truth.** The database schema (`migrations/*.sql`), the receipt shape (`schemas/*.json`), the prompts (`prompts/*.md`), the bot copy (`locales/*.json`) and all fixtures are plain files outside `backend/`. TypeScript reads them; it never becomes the only place a rule or shape is defined.
2. **Shared test cases for the rules.** Every pure rule in `src/rules/` gets its test cases as data in `fixtures/rules/<rule>.json` (input → expected output): money parsing, receipt validation, alert thresholds and suppression, username checks, Arabic normalisation, Cairo month boundaries. The TypeScript tests load these files; a Rust version runs the same files and must pass them all.
3. **Stable HTTP surface.** Routes, status codes and JSON shapes are the contract. When app endpoints are added, describe each in `docs/API.md` (method, path, auth, request and response JSON).
4. **No TypeScript-only infrastructure.** No Supabase Edge Functions, no ORM that owns the schema (Prisma, Drizzle migrations), no in-process schedulers or Node-only job queues. Scheduled jobs are HTTP endpoints called by Cloud Scheduler.
5. **Rust-friendly code style.** Money in integer piastres, dates as `'YYYY-MM-DD'` strings, explicit result types for expected failures (e.g. `{ ok: true, value } | { ok: false, reason }`) rather than throwing for normal outcomes, and small modules that map one-to-one to the layout in §3.
6. **Same deployment shape.** One Docker image on Cloud Run reading the same env vars. A Rust image can replace it with no change to Supabase, Whapi, Secret Manager or the app.

A port would go module by module behind the same routes, `src/rules/` first, then `db/`, then the integrations, checked against the shared fixtures at each step.
