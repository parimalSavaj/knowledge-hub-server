---
inclusion: manual
---

# Shared Middlewares Rules

## Location

- All global middlewares live in `src/shared/middlewares/`.
- These are reusable middleware functions applied across multiple routes or modules.

## Files

- `auth.middleware.ts` — verifies JWT access token, attaches `req.user` as `AuthenticatedUser`.
- `role.middleware.ts` — checks `req.user.orgRole` against an allowlist of roles.
- `validate.middleware.ts` — validates request shape using Zod schemas.

## Rules

- Middlewares are plain exported functions (or function factories) — never classes or singletons.
- `auth.middleware.ts` is the only file that reads or verifies JWT tokens — never do this elsewhere.
- `role.middleware.ts` always runs after `auth.middleware.ts` — it depends on `req.user` being set.
- `validate.middleware.ts` uses Zod schemas and throws `ValidationError` on failure.
- Middlewares never contain business logic — they guard, validate, or transform the request and pass through.
- Never apply `authenticate` globally to all routes — always be explicit per-route or per-router.
- File naming: `<name>.middleware.ts`.
