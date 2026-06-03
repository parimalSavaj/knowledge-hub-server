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

## Validate Middleware

- Accepts a Zod schema, parses `{ body, params, query }` from the request.
- On `ZodError` → formats messages into a single string → throws `ValidationError`.
- On success → calls `next()`.

## Validation Schema Structure

- Each module has one file: `presentation/<name>.validation.ts`.
- Every schema validates `body`, `params`, and `query` as separate nested objects.
- Each schema is a named export. No logic — only schema definitions.

```ts
// Short example
export const createUserSchema = z.object({
  body: z.object({ name: z.string().min(1), email: z.string().email() }),
});
```

## Rules

- Middlewares are plain exported functions — never classes or singletons.
- `auth.middleware.ts` is the only file that reads or verifies JWT tokens.
- `role.middleware.ts` always runs after `auth.middleware.ts` — depends on `req.user`.
- Zod is the only validation library — never mix with joi or others.
- Validation runs only in routes via `validate` middleware — never inside use cases or repositories.
- `sortBy` fields must use `z.enum([...])` — never `z.string()` — to prevent SQL injection.
- Coerce numeric params with `z.coerce.number()` — never parse manually in the controller.
- Never return raw Zod error objects to the client.
- Never apply `authenticate` globally — always explicit per-route.
- File naming: `<name>.middleware.ts`.
