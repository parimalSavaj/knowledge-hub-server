---
inclusion: manual
---

# Shared Core Rules

## Location

- All HTTP primitives live in `src/shared/core/`.
- This folder handles API errors, API responses, and the global error handler.

## Files

- `api-error.ts` — base `ApiError` class and all error subclasses (`NotFoundError`, `ValidationError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `InternalError`).
- `api-response.ts` — standard `ApiResponse` wrapper for all successful responses.
- `error-handler.ts` — global Express error handler middleware (`ErrorHandler.handleError`).

## Rules

- All error classes live together in `api-error.ts` — no separate files, no `errors/` subfolder.
- Every error subclass extends `ApiError` — never throw raw `Error` objects from use cases or repositories.
- The global error handler is the only place that formats error responses — controllers never handle errors inline.
- Never add business logic, routes, or service code inside `core/`.
- `core/` has no dependencies on `services/`, `middlewares/`, or `modules/` — it's a leaf dependency.
