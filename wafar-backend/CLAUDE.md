# CLAUDE.md — Wafar Asraa backend

@AGENTS.md

## Claude Code session rules

1. **Start every session by reading** `docs/STATUS.md` (where we are), then the milestone you were asked to do in `BUILD_PLAN.md`. If `docs/STATUS.md` doesn't exist yet, you're at milestone A0a.
2. **Plan first.** Before writing code for a milestone, list the files you'll create or change and the tests you'll add, then build.
3. **One milestone per session.** When it's done: run `npm run check` in `backend/` (format, lint, typecheck, tests); tick the boxes in `BUILD_PLAN.md`; append to `docs/STATUS.md`; commit with a message like `A1: Whapi webhook, message log, idempotency`; stop and summarise for the developer in plain words (what works, how to try it, what's needed next).
4. **Never run anything destructive against Supabase** (`DROP`, `TRUNCATE`, `DELETE` without a `WHERE`, reverting migrations, resetting the database). Read-only checks are fine. Schema changes go through a new migration file the developer can review first.
5. **Ask before deploying** to Cloud Run or changing anything in Google Cloud, Supabase settings or Whapi settings.
6. **Secrets:** read them from `.env` only. Never print them, log them, write them into files other than `.env`, or ask for them in chat. If one is missing, say which variable name is needed.
7. **External APIs:** check the current official docs (Whapi, Anthropic, Google Speech-to-Text, Supabase Storage) before writing an integration, and build zod schemas from real captured responses saved in `fixtures/`.
9. **Future Rust move:** follow `AGENTS.md` §12 in every milestone (pure rules in `src/rules/`, shared test cases in `fixtures/rules/`, no TypeScript-only infrastructure).
8. **Windows + PowerShell:** commands you give the developer must work in PowerShell.
