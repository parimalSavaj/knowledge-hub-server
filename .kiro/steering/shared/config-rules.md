---
inclusion: manual
---

# Shared Config Rules

## Location

- App configuration lives in `src/shared/config/index.ts`.
- This is the single source of truth for all environment variables.

## Structure

- Config is validated with Zod at boot time using `safeParse`.
- If any required env var is missing or invalid, the process exits immediately with a clear error message.
- Config is exported as a plain object (`export const config = { ... }`) — never a class, never a singleton service.

## Rules

- Never read `process.env` outside `src/shared/config/index.ts`.
- Never use string defaults for secret values — fail fast if they are missing.
- All new env vars must be added to both the Zod schema and `.env.example`.
- Feature flags and environment-specific behaviour always come from `config` — never from inline `process.env.NODE_ENV` checks.
- Never hardcode default values for secrets (JWT secrets, DB password) — these must always be explicitly set.

## .env Files

- `.env` — local development values (gitignored).
- `.env.example` — template with all keys, no real values (committed).
- Keep `.env.example` in sync with the config schema at all times.
