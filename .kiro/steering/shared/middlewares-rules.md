---
description: Rules for global middlewares (auth, role, validate)
inclusion: fileMatch
fileMatchPattern: "src/shared/middlewares/**"
---

# Shared Middlewares Rules

## Location

- All global middlewares live in `src/shared/middlewares/`.
- These are reusable middleware functions applied across multiple routes or modules.

## Files

- `auth.middleware.ts` — verifies JWT access token, attaches `req.user` as `AuthenticatedUser`.
- `role.middleware.ts` — checks `req.user.orgRole` against an allowlist of roles.
- `validate.middleware.ts` — validates request shape using Zod schemas via separate static methods.

## Validate Middleware

`ValidationMiddleware` is a class with **separate static methods** for each request part:

- `ValidationMiddleware.validateBody(schema)` — parses `req.body` against the schema.
- `ValidationMiddleware.validateQuery(schema)` — parses `req.query` against the schema.
- `ValidationMiddleware.validateParams(schema)` — parses `req.params` against the schema.

Each method accepts a Zod schema that validates **only that part** of the request (not a nested `{ body, params, query }` wrapper). On failure → formats errors → throws `ValidationError`. On success → calls `next()`.

Routes apply the specific method needed per endpoint:

```ts
// Body validation
this.router.post('/register', ValidationMiddleware.validateBody(registerBodySchema), this.controller.register);

// Params validation
this.router.get('/:id', ValidationMiddleware.validateParams(getUserParamsSchema), this.controller.getUser);

// Multiple validations on one route
this.router.get('/', ValidationMiddleware.validateQuery(listUsersQuerySchema), this.controller.listUsers);
```

## Validation Schema Structure

- Each module has one file: `presentation/<name>.validation.ts`.
- Each schema validates **only its part** of the request — body schemas validate body fields, params schemas validate param fields, query schemas validate query fields.
- Schema naming: `<action>BodySchema`, `<action>ParamsSchema`, `<action>QuerySchema`.
- Each schema is a named export. No logic — only schema definitions.

```ts
// Body schema — validates req.body directly
export const registerBodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

// Params schema — validates req.params directly
export const getUserParamsSchema = z.object({
  id: z.string().uuid(),
});

// Query schema — validates req.query directly
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
```

## Rules

- `ValidationMiddleware` is a class with static methods — not a plain exported function.
- `auth.middleware.ts` is the only file that reads or verifies JWT tokens.
- `role.middleware.ts` always runs after `auth.middleware.ts` — depends on `req.user`.
- Zod is the only validation library — never mix with joi or others.
- Validation runs only in routes via `ValidationMiddleware` static methods — never inside use cases or repositories.
- `sortBy` fields must use `z.enum([...])` — never `z.string()` — to prevent SQL injection.
- Coerce numeric params with `z.coerce.number()` — never parse manually in the controller.
- Never return raw Zod error objects to the client.
- Never apply `authenticate` globally — always explicit per-route.
- File naming: `<name>.middleware.ts`.
