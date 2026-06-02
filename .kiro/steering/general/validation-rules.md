# Validation Rules

## Overview

- **Zod** is the validation library for this project — no joi, no express-validator.
- Validation happens at the HTTP boundary only — in the routes layer via middleware.
- Use cases and repositories trust their inputs — they never re-validate.

## Validation Middleware

A single shared `validate` middleware lives in `src/shared/middlewares/validate.middleware.ts`.

`ValidationError` extends `ApiError` and is defined inside `src/shared/core/api-error.ts` alongside all other error subclasses. The global `ErrorHandler` handles it automatically like any other `ApiError`.

```ts
// src/shared/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../core/api-error';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        next(new ValidationError(messages.join(', ')));
      } else {
        next(error);
      }
    }
  };
};
```

## Schema Structure

Every validation schema validates `body`, `params`, and `query` as separate objects in one schema:

```ts
// presentation/users.validation.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const getUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.enum(['name', 'email', 'created_at']).default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
  }),
});
```

## Validation File Location

Each module has one validation file: `presentation/<name>.validation.ts`

- All schemas for that module live in this one file.
- Each schema is a named export.
- No logic — only schema definitions.

## Applying Validation in Routes

```ts
import { validate } from '../../../shared/middlewares/validate.middleware';
import { createUserSchema, getUserSchema } from './users.validation';

this.router.post('/', validate(createUserSchema), this.controller.createUser);
this.router.get('/:id', validate(getUserSchema), this.controller.getUser);
```

## Rules

- Zod is the only validation library — never mix with joi or other validators.
- Validation runs only in routes via the `validate` middleware — never inside use cases or repositories.
- Every schema validates `body`, `params`, and `query` as separate nested objects.
- `sortBy` fields must use `z.enum([...])` with an explicit allowlist — never `z.string()` — to prevent SQL injection.
- Coerce numeric path params and query params with `z.coerce.number()` — never parse manually in the controller.
- Validation errors are formatted as a single readable string and thrown as `ValidationError`.
- Never return raw Zod error objects to the client.
