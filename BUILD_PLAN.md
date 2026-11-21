# BUILD_PLAN.md — Wafar Asraa MVP (وفر أسرة)

Step-by-step build instructions for the AI coding agent and the team. Read `AGENTS.md` first (stack, rules, folder layout), then work through this plan **in order, one milestone at a time**.

**How to use this file**

- Each milestone has a **Goal**, **Tasks**, **Done when** (the checks that must pass) and **Don't** (traps to avoid).
- Finish and demo a milestone before starting the next. Tick the boxes as you go and commit this file with the ticks.
- At the end of each milestone, write a short summary: what changed, how to test it by hand, anything left open.
- If a task needs a decision that is not in `AGENTS.md` or `docs/PRD.md`, stop and ask. Don't guess.

**What "the MVP" means**

- **Part A — WhatsApp MVP (live users).** The real product for the first 25 families: receipt reading, spending summaries, memory and overspend alerts, in English and Egyptian Arabic.
- **Part B — App prototype (investors).** A clickable Expo app showing the full vision. It reads real receipts and spending from the same database but uses sample prices for shopping and places no real orders.

Part A comes first. Part B can start once Milestone A3 works, in parallel.

---

## Part A — WhatsApp MVP

### A0. Setup: accounts, repo and a live "hello"

**Goal:** an empty TypeScript (Node.js) service running on Cloud Run, connected to Supabase, with every secret in place.

A0 runs in two parts: **A0a** scaffolds everything that needs no credentials; the developer then fills in `.env`; **A0b** connects the database and deploys.

**A0a tasks (no credentials needed)**
- [x] `git init`, `.gitignore` (`node_modules/`, `dist/`, `.env`, `*.pem`, `*.json` key files outside `schemas/`, `fixtures/`, `locales/` and the `backend/` config files), `.gitattributes` (`* text=auto eol=lf`), and the folder layout from `AGENTS.md` §3. The build-pack files (`migrations/`, `schemas/`, `prompts/`, `docs/`, `.env.example`) are already in place: don't rewrite them.
- [x] `backend/`: npm project with the packages from `AGENTS.md` §2 (`npm install` latest stable versions), `tsconfig.json` (strict, ESM), `biome.json`, and scripts `dev`, `build`, `start`, `check`, `test`, `test:live`, `migrate`, `db:types`. `main.ts` sets up `pino` JSON logs, loads `Config`, and serves `GET /health`. `Config` fails fast with a clear message listing missing variables, but `npm run build` and `npm test` must work with no `.env`.
- [x] `/health` returns `{"status":"ok","db":"ok"}` when the database answers `select 1`, and `{"status":"degraded","db":"error"}` with HTTP 503 otherwise.
- [x] `src/lib/money.ts`: piastres helpers (`toPiastres`, `fromNumericString`, `parseMoneyInput`, `formatMoney` for `1,250 EGP` / `١٬٢٥٠ جنيه`) with tests driven by `fixtures/rules/money.json`.
- [x] `ai/receipt.ts`: zod schema and types that match `schemas/receipt_extraction.schema.json` exactly, plus a test that a sample receipt JSON parses. `src/rules/receiptValidation.ts`: the pure validation function from `AGENTS.md` §7 (it takes the receipt **and its source**: photo, voice or text) with tests driven by `fixtures/rules/receipt_validation.json`: good receipt, totals off by more than 1 EGP, total `null`, low confidence, blurry/cut off, not a receipt, **VAT already included in the item prices** (tax line printed but not added on top, must pass), **VAT added on top** (must pass), and a **typed purchase with one amount for several things** ("milk and bread for 85", must pass).
- [x] `db/schema.generated.ts` written by hand from `0001_init.sql` (regenerated from the real database in A0b).
- [x] `docs/STATUS.md` created with the first entry.
- [x] Stop and print the exact list of `.env` variables the developer must fill in for A0b.

**Developer step between A0a and A0b:** copy `.env.example` to `.env` and fill in at least `DATABASE_URL`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

**A0b tasks (with credentials)**
- [ ] **Check the existing Supabase database before changing anything.** Read-only: list the tables, enums, storage buckets and row counts in the `public` schema, and compare them with `migrations/0001_init.sql`. Then:
    - Database is empty → apply `0001_init.sql` once (`npm run migrate`), then confirm 15 tables, 14 categories and 2 private buckets.
    - Database already matches → record it as applied in `schema_migrations` (`npm run migrate -- --mark-applied 0001`) without re-running it.
    - Database has a different schema → **stop**, write the differences to `docs/STATUS.md`, and ask which one to keep. Never drop or alter existing tables on your own.
- [ ] Regenerate `db/schema.generated.ts` from the real database (`npm run db:types`) and commit it.
- [ ] `backend/Dockerfile`: multi-stage build (`node:24-slim` builder runs `npm ci` + `npm run build` → `node:24-slim` runtime with production dependencies only), runs as the non-root `node` user, listens on `$PORT`.
- [ ] Google Cloud: Artifact Registry repo, Cloud Run service in `europe-west3`, **min instances 1, CPU always allocated**, secrets from Secret Manager mapped to the env vars in `AGENTS.md` §4.
- [ ] GitHub Actions: on every push run `npm ci` and `npm run check` in `backend/`. Deploy to Cloud Run on push to `main`.
- [ ] Anthropic API key, Whapi channel with the test number, and Google Speech-to-Text API enabled.

**Done when**
- `GET https://<service>/health` returns `{"status":"ok","db":"ok"}`.
- CI is green and a push to `main` deploys automatically.
- No secret appears in the repo, the Docker image or the logs.

**Don't:** use the Supabase transaction pooler (port 6543). Don't commit `.env`.

---

### A1. WhatsApp in and out

**Goal:** every WhatsApp message reaches the backend once, is logged, and gets a reply.

**Tasks**
- [ ] **Capture real payloads first.** Point the Whapi webhook at a temporary request catcher or a logging route. From a test phone send: a text, an image, an image with a caption, a voice note, a reply to a message, and a message in a group. Save each raw JSON body to `fixtures/whapi/<type>.json` with phone numbers replaced by fake ones.
- [ ] Read Whapi's official docs for the fields used. Write zod schemas **from the captured fixtures**, not from memory.
- [ ] Route `POST /webhooks/whapi/:secret` (or signature check, if Whapi supports one). Wrong secret → `401`.
- [ ] On each inbound message: insert into `wa_messages` (direction `inbound`). If `wa_message_id` already exists, return `200` and do nothing. Otherwise return `200` immediately and process in the background (`processInBackground()`, not awaited, every error caught and logged).
- [ ] Ignore group messages, status updates and our own outbound messages.
- [ ] `WhatsAppGateway` interface with `sendText`, `downloadMedia`; `WhapiClient` implements it. Every outbound message is logged to `wa_messages` (direction `outbound`).
- [ ] Outbound rate limit: max 1 message per second per recipient, with a small random delay.
- [ ] Temporary behaviour: reply "Got it ✅" to any text so the round trip can be tested.
- [ ] Fixture tests: each file in `fixtures/whapi/` parses into the right message kind.

**Done when**
- A text from the test phone gets a reply within 3 seconds.
- Sending the same webhook body twice (replay with curl) creates one `wa_messages` row and one reply.
- Group messages get no reply.
- Logs show masked phone numbers only.

**Don't:** do slow work (AI calls, downloads) before returning `200` to the webhook.

---

### A2. Onboarding

**Goal:** a new number becomes a user with a family, in English or Arabic.

**Tasks**
- [ ] `locales/en.json` and `locales/ar.json` with every onboarding message (starter copy in the appendix). `i18n.ts` loads them at startup and fails if a key exists in one language but not the other.
- [ ] Unknown phone number → create `users` row (phone only) and start onboarding. Store progress so a user can stop and continue later.
- [ ] Migration `0002_conversation_state.sql` (shown to the developer before applying). Onboarding is not the only time the bot waits for the user's next answer: "delete my data" needs a yes/no (A10) and other flows will too. So add both:
    - `users.onboarding_step text` (null once onboarded), to resume onboarding.
    - `users.pending_action jsonb` and `users.pending_action_expires_at timestamptz`: one generic "waiting for an answer" slot, e.g. `{"type":"confirm_delete_data"}`. Cleared when answered or expired; an expired action is ignored and the message is handled normally.
    - Family invites don't need it: the `family_members` row with status `invited` already says the bot is waiting for an accept/decline (A6).
- [ ] Steps: language → first name → username → family size → monthly budget (optional, "later" allowed) → how-to message.
- [ ] Username: lowercase it, check `^[a-z0-9_]{3,30}$`, check it's free; if taken, suggest two free variants.
- [ ] On finish: create `families` row (owner = user, household_size, monthly_budget), `family_members` row (role `owner`, status `active`), and a `budgets` row for the current month if a budget was given. Set `onboarded_at`.
- [ ] Commands that work any time: `help` / `مساعدة`, `language` / `اللغة` to switch language.
- [ ] Unit tests for each step's input validation (budget accepts "5000", "5,000", "٥٠٠٠", "5k"), with the cases in `fixtures/rules/` (`AGENTS.md` §12).

**Done when**
- A fresh number can finish onboarding in English, and another in Arabic, with no dead ends.
- Typing something unexpected at any step gets a friendly re-ask, not an error.
- Restarting halfway (messaging again the next day) continues from the same step.

**Don't:** ask for email, address, card or ID details.

---

### A3. Receipt reading (photos)

**Goal:** a receipt photo becomes a correct `receipts` + `receipt_items` record and a short confirmation.

**Tasks**
- [ ] Inbound image → download via the gateway → resize so the long edge is at most 1568 px → upload the original to Storage bucket `receipts` at `{user_id}/{receipt_id}.jpg` → create `receipts` row (status `received`, source `photo`, `wa_message_id`).
- [ ] `ai/claude.ts`: call the Messages API (official `@anthropic-ai/sdk`) with the system prompt from `prompts/receipt_system.md`, the image as a base64 image block, and `output_config.format` = the JSON schema from `schemas/receipt_extraction.schema.json` (without `$comment`). Model from `CLAUDE_RECEIPT_MODEL`.
- [ ] Handle `stop_reason`: `max_tokens` → retry once with a larger limit; `refusal` → status `failed`, ask the user to resend. Network or 5xx errors → retry with backoff (max 3 tries).
- [ ] Parse with the zod `ReceiptSchema` in `ai/receipt.ts`. Save the raw output to `receipts.ai_raw`, `ai_model`, `ai_confidence`.
- [ ] **Validate in code** with `src/rules/receiptValidation.ts` (rules in `AGENTS.md` §7). Outcomes:
    - Good → save store (find or create in `stores` by name), branch, date (fallback: message date), total, and every item into `receipt_items` with its category. Status `parsed`. Send the confirmation.
    - Low confidence or blurry/cut off → status `needs_review`, ask for a clearer photo, keep the row.
    - Not a receipt → status `failed`, friendly explanation of what to send.
- [ ] Corrections: a reply such as "the total was 450" / "الإجمالي كان ٤٥٠" updates the user's latest receipt, sets `user_corrected = true`, and confirms.
- [ ] **Accuracy test (model choice).** Collect 20 real receipts (mix of chains and small shops, Arabic and English, clear and faded). Put each photo and its hand-checked correct JSON in `fixtures/receipts/`. Run both `claude-haiku-5-5` and `claude-sonnet-5-5` over them with `npm run test:live -- receipts_accuracy` (needs `LIVE_AI=1`) and print, per model: total correct (±1 EGP), date correct, items count correct, average cost per receipt. Pick the cheapest model that reaches 85% fully correct and set `CLAUDE_RECEIPT_MODEL`.

**Done when**
- A clear receipt is saved and confirmed in under 20 seconds.
- The accuracy report is written to `docs/receipt-accuracy.md` and the model is chosen.
- A blurry photo gets "please send a clearer photo", not a wrong save.
- Sending the same photo message twice creates one receipt.

**Don't:** accept free-form JSON or "fix" the model's JSON with string hacks. Don't save a guessed total.

---

### A4. Voice notes and typed purchases

**Goal:** purchases without a receipt are captured too.

**Tasks**
- [ ] Inbound voice note → download → upload to bucket `voice-notes` → `stt.ts` transcribes (Google Speech-to-Text, `ar-EG` with `en-US` alternative) → save `receipts.transcript`.
- [ ] Transcript or a typed purchase message ("اشتريت خضار بـ150 من السوق") → same Claude call with the text instead of an image → same validation and save, with source `voice` or `text`.
- [ ] `bot/router.ts` decides what a text message is: purchase, question about spending, family command, memory/forget command, correction, or small talk. Use a small Claude call with a strict JSON output for this (intent + extracted fields), with simple keyword shortcuts first for obvious commands.

**Done when**
- An Egyptian Arabic voice note like "جبت لحمة بـ٤٠٠ جنيه من الجزار" is saved as a 400 EGP purchase in `meat_poultry_fish`.
- A typed "bought milk and bread for 85" is saved correctly.
- A question like "how much did I spend?" is **not** saved as a purchase.

---

### A5. Product matching and price capture

**Goal:** receipt lines link to real products so prices start building up.

**Tasks**
- [ ] `matching.ts`, in this order: barcode match on `products.barcode` → exact `product_aliases` match for this store → exact alias with no store → trigram similarity on product names (`pg_trgm`), auto-match only above a threshold (start at 0.75), otherwise leave `unmatched`.
- [ ] Normalise names before matching: lowercase, trim, unify Arabic letters (أ إ آ → ا, ة → ه, ى → ي), remove diacritics and tatweel, convert Arabic-Indic digits.
- [ ] No product found → create a new `products` row (unverified) from `name_en`, `brand`, `size_text`, category, and an alias for the raw name.
- [ ] Every matched line with a known store → insert into `prices` (source `receipt`).
- [ ] Minimal admin page (internal, protected by a simple admin password in env): list `unmatched` and low-score matches, confirm or change the product, which saves a confirmed alias.

**Done when**
- The same product bought twice at the same store matches automatically the second time.
- `latest_prices` returns one current price per product per store.
- The admin page can clear the review queue.

**Don't:** put any user data in `prices`.

---

### A6. Family

**Goal:** family members' spending counts together.

**Tasks**
- [ ] "add @username" / "add +20…" / "ضيف @username" → create `family_members` row (status `invited`) and message the invitee with accept/decline.
- [ ] Accept → status `active`. If the invitee is already active in another family, explain they must leave it first ("leave family").
- [ ] Only the owner can invite and remove. "leave family" works for members.
- [ ] New receipts store the user's current `family_id`.

**Done when**
- Owner invites a member, the member accepts, and the member's next receipt appears in the family's monthly total.
- A user can't be active in two families (the database blocks it and the bot explains why).

---

### A7. Spending summaries

**Goal:** users can see where their money goes.

**Tasks**
- [ ] On-demand: "how much this week/month?", "how much on meat?", "how much at <store>?" in both languages → totals by category and store for the user (members) or the family (owner).
- [ ] Monthly status line in every summary: spent vs budget, % used, days left.
- [ ] Migration `000N_outbox.sql` (shown to the developer before applying). The schema has nowhere to keep a summary that must wait for the user's next message, or to remember it was already sent. Add `outbox`: `id`, `user_id` (cascade on delete), `kind` (`weekly_summary`, `monthly_report`, later alerts), `period_key` (e.g. `2026-W45`, `2026-11`), `payload jsonb`, `created_at`, `sent_at`, with a **unique index on `(user_id, kind, period_key)`** so a job run twice creates nothing new.
- [ ] Weekly summary every Friday morning (Cairo time): the job writes one `outbox` row per user, then sends it **only** to users who messaged in the last 24 hours and sets `sent_at`. Unsent rows are delivered right after the user's next inbound message is answered. Drop rows that are older than their period (no last-week summary next month).
- [ ] Monthly report on the 1st: total, vs budget, top 3 categories, biggest purchase.
- [ ] Scheduling: Cloud Scheduler calls a protected internal endpoint (`POST /internal/jobs/weekly-summary`), not an in-process timer.
- [ ] All number formatting through one helper (`1,250 EGP` / `١٬٢٥٠ جنيه`).

**Done when**
- Summary totals match a SQL check on the same data exactly.
- Running the weekly job twice in a row sends nothing the second time.

---

### A8. Memory

**Goal:** the assistant remembers what users tell it.

**Tasks**
- [ ] Detect reasons and facts in messages ("this month is high because of my daughter's birthday", "we do a big shop every 1st") → save `memory_notes` with `kind`, optional category, and `applies_until` (end of month for overspend reasons unless the user says otherwise).
- [ ] "What do you remember?" / "فاكر إيه عني؟" → list active notes, numbered.
- [ ] "forget 2" / "forget the birthday" → set `active = false` and confirm.
- [ ] Pass the user's active notes into the Claude calls that answer questions, so replies use them.

**Done when**
- A saved reason shows up in "what do you remember?" and disappears after "forget".
- Notes never leak between users or families (test it).

---

### A9. Overspend alerts

**Goal:** families are warned before the budget is gone, and not nagged.

**Tasks**
- [ ] After each saved receipt, compute the family's month-to-date spend vs budget (and category budgets if set).
- [ ] Thresholds: 80% → `budget_80`, 100% → `budget_100`. Unusual receipt → `unusual_receipt` when one receipt is more than 3× the family's median receipt over the last 60 days (needs at least 5 receipts).
- [ ] Before sending, look for an active memory note covering this month (and category, if any). If found, insert the alert with `suppressed_by` set and don't send.
- [ ] Rely on the unique index so each budget alert happens once per month.
- [ ] Alert copy is warm and includes days left and one practical tip.
- [ ] Unit tests for the alert rules as pure functions (no DB).

**Done when**
- Crossing 80% sends exactly one alert; crossing 100% sends exactly one more.
- After the user explains the overspend, no further alert for that reason that month.

---

### A10. Hardening and pilot launch

**Goal:** safe and stable enough for 25 real families.

**Tasks**
- [ ] Error handling: every failure path sends the user a friendly message, never silence or a stack trace.
- [ ] Alerts for the team: log-based alert in Cloud Monitoring on error rate and on webhook failures; daily summary of receipts processed, failed and needing review.
- [ ] Privacy: "delete my data" / "امسح بياناتي" asks for a yes/no (via `users.pending_action`), then in one transaction deletes the user, their Storage files and their messages. The schema does **not** do all of this by itself:
    - `families.owner_id` is `on delete restrict`, so deleting a family owner fails. If the family has other active members, hand ownership to the longest-standing active member first and tell them; if not, delete the family (its budgets, members and memory cascade).
    - `wa_messages.user_id` is `on delete set null`, so the phone number and message bodies would stay. Delete `wa_messages` rows by `user_id` **and** by `phone`.
    - Delete Storage objects under `receipts/{user_id}/` and `voice-notes/{user_id}/` before the database rows.
    - Test: deleting an owner with a member, an owner alone, and a plain member all succeed and leave no row with their id or phone.
- [ ] Load check: 50 receipts sent in 5 minutes are all processed and answered.
- [ ] Backups: confirm Supabase daily backups are on.
- [ ] Write `docs/RUNBOOK.md`: how to deploy, roll back, rotate keys, re-run a failed receipt, and what to do if the Whapi number is banned.
- [ ] Onboard the first 5 test families, then grow to 25.

**Done when:** everything in the **MVP finish line** below is true.

---

## Part B — App prototype (investors)

> **Not built in this repo.** The investor demo already exists as a separate Vite + React web app. This section is kept for reference only. The backend's job for Part B is to expose the endpoints that app will need later (receipts, spending, family, memory, `/app/chat`), and only when asked.

Start after A3 works. The prototype runs on real phones through Expo and shows the full product. Shopping uses sample prices; nothing is ordered for real.

### B0. Project setup
- [ ] `app/`: Expo (latest SDK), TypeScript, Expo Router, React Native Reanimated, Supabase JS client with the **anon key only**.
- [ ] Design tokens (colors, type scale, spacing, radius) in one file, light and dark themes.
- [ ] **Arabic and RTL from day one:** i18n setup with `en` and `ar`, `I18nManager` RTL switching, Arabic font that supports both scripts. Every screen must be checked in both directions.
- [ ] Sign in with phone number (Supabase phone OTP). On first sign-in, link `users.auth_user_id` to the WhatsApp user with the same phone (a small backend endpoint does this with the service key).

### B1. Home
- [ ] Typing savings message above the input field, from the user's real data. New-user variant. Plays once per app open; types right to left in Arabic; static when reduce-motion is on.
- [ ] Input field opens the chat screen. Shortcut buttons below: Instant shop, Snap my list, Reorder last basket, My spending.
- [ ] Month card: spent vs budget ring, latest 3 receipts.

### B2. Instant shop and price card
- [ ] Sample data: ~60 common products across the 14 categories, 4–5 sample stores with logos, prices, distances and "updated" dates. Put it in `app/sample-data/` and label it clearly in code as sample.
- [ ] Product grid with category tabs and search; each tile shows "from X EGP".
- [ ] Price card (bottom sheet): product image center, store row with logo, price, % saved, distance, last updated; cheapest highlighted; quantity +/–; closes with X (top right EN, top left AR) or swipe down.
- [ ] Cart bar: items, total, saved.

### B3. Chat shopping assistant
- [ ] Chat UI with text input, voice input and "snap a list" camera.
- [ ] Backend endpoint `POST /app/chat` (auth with the Supabase user JWT) calls Claude with tool use: `search_products`, `get_prices`, `get_budget`, `build_basket`. The assistant may only quote prices returned by these tools.
- [ ] Over-budget conversation: swaps first, then drop or raise budget.
- [ ] Confirmation card in the chat with items, stores, total, saving, delivery fee, Edit and Approve. Approve shows "Order placed (demo)" and never creates a real order.

### B4. The rest of the screens
- [ ] Cart and checkout (demo): one order, one delivery, delivery fee, saving after delivery.
- [ ] Scan receipt (calls the same backend receipt reader), spending history charts, family members, alerts and memory, settings (language, budget, notifications).

### B5. Demo ready
- [ ] A 3-minute demo script in `docs/DEMO.md` that walks through Home → Instant shop → Chat with a budget → Confirmation → Spending history, in English and Arabic.
- [ ] Builds installed on one iPhone and one Android phone via Expo, tested offline-free on a normal mobile connection.

**Prototype done when:** the demo script runs end to end on both phones in both languages with no crashes, no placeholder text, and real receipt and spending data from the WhatsApp pilot.

---

## MVP finish line

The MVP is finished when **all** of these are true.

**Product (WhatsApp)**
- [ ] A new user onboards fully on WhatsApp in English or Egyptian Arabic.
- [ ] A clear receipt photo is saved correctly and confirmed in under 20 seconds.
- [ ] A blurry or non-receipt photo gets a helpful reply, never a wrong save.
- [ ] Voice notes and typed purchases are saved.
- [ ] Users can ask how much they spent by week, month, category or store, and get correct numbers.
- [ ] Budget alerts fire once at 80% and once at 100%, and stay quiet when the user gave a reason.
- [ ] Users can see and delete what the assistant remembers.
- [ ] A family owner can add members, and members' receipts count toward the family total.
- [ ] Users can delete all their data.

**Quality**
- [ ] Receipt accuracy is 85% or more on the 20-receipt test set with the chosen model.
- [ ] Duplicate webhook deliveries never create duplicate records.
- [ ] CI is green; `npm run check` (format, lint, typecheck, tests) passes with no warnings; every milestone's tests pass.
- [ ] No secrets in the repo, image or logs; phone numbers masked in logs.

**Operations**
- [ ] Running on Cloud Run with health checks, error alerts and a daily processing summary.
- [ ] `docs/RUNBOOK.md` exists and someone other than the builder has followed it once.
- [ ] 25 families are onboarded and using it.

**Investors**
- [ ] The app prototype passes "Prototype done when" above.

---

## Appendix — starter bot copy

Put these in `locales/*.json` and refine with real users. Arabic is Egyptian dialect on purpose. `{name}` style placeholders are filled by the bot.

| Key | English | Arabic (Egyptian) |
| --- | --- | --- |
| `welcome` | Welcome to Wafar Asraa 👋 I'll help you see where your money goes and spend less. English or Arabic? | أهلاً بيك في وفر أسرة 👋 هساعدك تعرف فلوسك بتروح فين وتوفّر في المصاريف. تحب نتكلم عربي ولا إنجليزي؟ |
| `ask_name` | Great! What's your first name? | تمام! اسمك إيه؟ |
| `ask_username` | Pick a username (English letters and numbers only), like mona_2026. Family members will add you with it. | اختار اسم مستخدم بالإنجليزي (حروف وأرقام بس)، زي mona_2026. أهلك هيضيفوك بيه. |
| `ask_family_size` | How many people live in your home? | كام فرد في البيت؟ |
| `ask_budget` | Roughly how much is your monthly household budget? You can say "later". | ميزانية البيت في الشهر كام تقريبًا؟ ممكن تقول "بعدين". |
| `how_to` | All set! After shopping, send me a photo of the receipt or a voice note, and I'll track everything. | كده تمام! بعد ما تشتري، ابعتلي صورة الفاتورة أو فويس نوت وأنا هسجّل كل حاجة. |
| `receipt_saved` | Saved ✅ {store}: {total} EGP, {count} items. Biggest category: {top_category}. You've used {pct}% of this month's budget. | اتسجّلت ✅ {store}: {total} جنيه، {count} صنف. أكتر حاجة: {top_category}. استخدمت {pct}% من ميزانية الشهر. |
| `receipt_unclear` | That photo is a bit hard to read 🙏 Could you take it again in good light, with the whole receipt in the frame? | الصورة مش واضحة أوي 🙏 ممكن تصوّر الفاتورة تاني في نور كويس والفاتورة كلها باينة؟ |
| `not_a_receipt` | That doesn't look like a receipt 😅 Send a photo of your receipt, or tell me what you bought and for how much. | دي مش شكلها فاتورة 😅 ابعتلي صورة الفاتورة، أو قولّي اشتريت إيه وبكام. |
| `alert_80` | Heads up: you've used {pct}% of this month's budget with {days} days left. If there's a reason, tell me and I'll remember it. | تنبيه صغير: صرفت {pct}% من ميزانية الشهر وفاضل {days} يوم. لو في سبب قولّي وأنا هفتكره. |
| `alert_100` | You've reached this month's budget ({budget} EGP). Want to look at where we can save for the rest of the month? | وصلت لميزانية الشهر ({budget} جنيه). تحب نشوف مع بعض نوفّر في إيه باقي الشهر؟ |
| `memory_saved` | Got it, I'll remember: {reason}. No more alerts about this. | تمام، هفتكر: {reason}. مش هنبّهك تاني على كده. |
| `memory_forgotten` | Done, I've forgotten that. | خلاص، نسيتها. |
