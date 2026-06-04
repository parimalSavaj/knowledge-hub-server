---
description: Rules for HTTP primitives (ApiError, ApiResponse, ErrorHandler)
inclusion: fileMatch
fileMatchPattern: "src/shared/core/**"
---

# Shared Core Rules

## Location

- All HTTP primitives live in `src/shared/core/`.
- This folder handles API errors, API responses, and the global error handler.

## Files

- `api-error.ts` — base `ApiError` class and all error subclasses.
- `api-response.ts` — standard `ApiResponse` wrapper for all successful responses.
- `error-handler.ts` — global Express error handler middleware (`ErrorHandler.handleError`).

## Error Hierarchy

```
ApiError (base)
├── NotFoundError        → 404
├── ValidationError      → 400
├── ConflictError        → 409
├── UnauthorizedError    → 401
├── ForbiddenError       → 403
└── InternalError        → 500
```

All subclasses live in `api-error.ts` — one file, no splitting.

## Where Errors Are Thrown

| Layer | Can throw | Example |
|---|---|---|
| Use case | Domain errors | `throw new NotFoundError('User not found')` |
| Repository | `InternalError` only | DB failures, connection errors |
| Controller | Never throws | passes to `next(error)` |
| Validation middleware | `ValidationError` | Invalid request shape |

## Error Handler

- Catches all errors via `next(error)`.
- `ApiError` → uses `error.toJSON()` for response.
- Unknown error → responds with `500 Internal Server Error`.
- In development, includes `error.stack`.
- Never exposes raw DB or third-party error messages in production.

## Rules

- All error classes live together in `api-error.ts` — no separate files.
- Use cases throw named errors (`NotFoundError`, `ConflictError`) — never raw `Error` or `ApiError` directly.
- Controllers never throw — always `next(error)`.
- Repositories throw `InternalError` for unexpected DB failures only.
- Never catch and swallow errors silently.
- Never use `console.error` — use `LoggerService` in the error handler.
- Error messages must be human-readable and safe to expose to clients.
- `core/` has no dependencies on `services/`, `middlewares/`, or `modules/` — it's a leaf dependency.
