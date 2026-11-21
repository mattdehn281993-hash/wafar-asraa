# START HERE — Wafar Asraa backend

This folder is the **backend** for Wafar Asraa: the WhatsApp bot now, and the API for the app later. It is separate from the investor demo (the Vite + React web app). Claude Code in VS Code builds it milestone by milestone from the files in this folder.

## What's in this folder

| File | What it is |
| --- | --- |
| `START_HERE.md` | This guide, for you |
| `CLAUDE.md` | Read automatically by Claude Code at the start of every session; pulls in `AGENTS.md` |
| `AGENTS.md` | The rules: stack, folder layout, database, WhatsApp, receipt reading, privacy |
| `BUILD_PLAN.md` | Milestones A0–A10 with tasks and "done when" checks |
| `PROMPTS.md` | The exact prompt to paste into Claude Code for each milestone |
| `docs/PRD.md` | What the product does (backend scope) |
| `docs/APP_UI_PRD.md` | The app's screens, for later app endpoints |
| `migrations/0001_init.sql` | The full database schema |
| `schemas/receipt_extraction.schema.json` | The exact JSON Claude must return for a receipt |
| `prompts/receipt_system.md` | The instructions Claude gets when reading receipts |
| `.env.example` | Every setting the backend needs, with no values |

## 1. One-time setup on your laptop (PowerShell)

```powershell
# Rust (you already have rustup; make sure it's current)
rustup update stable

# Database tooling for migrations and compile-time SQL checks
cargo install sqlx-cli --no-default-features --features rustls,postgres

# Git, if not installed yet
winget install --id Git.Git -e
```

Optional now, needed at the end of A0b: Docker Desktop and the Google Cloud CLI (`winget install Google.CloudSDK`), then `gcloud auth login`.

## 2. Put the folder in place

1. Unzip this pack to where you keep projects, for example `C:\Users\<you>\Greystone Automation\wafar-backend`.
2. Open the folder in VS Code (**File → Open Folder**).
3. Open Claude Code in VS Code. Check it shows the folder name, so it reads `CLAUDE.md`.

## 3. Build milestone by milestone

1. Open `PROMPTS.md`, copy the **A0a** prompt, paste it into Claude Code.
2. Let it work. At the end it writes `docs/STATUS.md`, commits, and tells you what to test.
3. Test it the way it tells you. If something is wrong, tell it in the same session.
4. Start a **new** Claude Code session for the next milestone (cleaner context), and paste the next prompt.

## 4. Add your credentials after A0a

When A0a is done, Claude Code lists the variables it needs. Then:

```powershell
Copy-Item .env.example .env
code .env
```

Fill in from the Supabase dashboard (**Project Settings → Database** and **Project Settings → API**):

- `DATABASE_URL`: the **Session pooler** connection string (port **5432**, not 6543), with your database password in it.
- `SUPABASE_URL`: the project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: the `service_role` key. Backend only; never put it in the app.

Later milestones add `ANTHROPIC_API_KEY`, `WHAPI_TOKEN`, `WHAPI_API_URL`, `WHAPI_WEBHOOK_SECRET` and the Google speech-to-text settings. Each milestone prompt says which ones it needs.

`.env` is never committed and never pasted into chat.

## 5. About the existing Supabase project

Your Supabase project already exists. In A0b, Claude Code first **reads** what's in it, without changing anything:

- **Empty** → it applies `0001_init.sql`.
- **Already matches** → it just records the schema as applied.
- **Different** → it stops, writes the differences to `docs/STATUS.md`, and asks you which to keep.

It will never drop or overwrite tables on its own.

## 6. Things only you can do

| When | What |
| --- | --- |
| Before A0b | Fill in the Supabase values in `.env` |
| Before A0b deploy | Google Cloud project with billing, `gcloud auth login` |
| Before A1 | Whapi channel connected to the test number; `WHAPI_TOKEN`, `WHAPI_API_URL` in `.env`; a test phone to send messages from |
| Before A3 | Anthropic API key; about 20 real receipts photographed (mix of chains and small shops, Arabic and English) |
| Before A4 | Google Speech-to-Text API enabled on the Google Cloud project |
| Any time | Start Meta Business verification, for moving off Whapi later |
