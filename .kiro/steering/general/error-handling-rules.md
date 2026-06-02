# Error Handling Rules

## Error Hierarchy

All errors thrown in this project extend `ApiError`. Never throw raw `Error` objects from use cases or repositories.

```
ApiError (base)
├── NotFoundError        → 404
├── ValidationError      → 400
├── ConflictError        → 409
├── UnauthorizedError    → 401
├── ForbiddenError       → 403
└── InternalError        → 500
```

All error classes — base and subclasses — live together in `src/shared/core/api-error.ts`. No separate files, no `errors/` subfolder.

```ts
// src/shared/core/api-error.ts

export class ApiError extends Error {
  // ... existing base class
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(HTTP_STATUS.NOT_FOUND, message);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed') {
    super(HTTP_STATUS.BAD_REQUEST, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource already exists') {
    super(HTTP_STATUS.CONFLICT, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(HTTP_STATUS.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(HTTP_STATUS.FORBIDDEN, message);
  }
}

export class InternalError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
  }
}
```

All imports come from the same file:
```ts
import { NotFoundError, ValidationError, ConflictError } from '../shared/core/api-error';
```

## Where Errors Are Thrown

| Layer | Can throw | Example |
|---|---|---|
| Use case | Domain errors | `throw new NotFoundError('User not found')` |
| Repository | `InternalError` only | DB failures, connection errors |
| Controller | Never throws — passes to `next(error)` | `catch (error) { next(error) }` |
| Routes | Never throws | — |
| Validation middleware | `ValidationError` | Invalid request shape |

## Error Handler

`ErrorHandler.handleError` in `src/shared/core/error-handler.ts` is the single global error handler.

- Catches all errors passed via `next(error)`.
- If `error instanceof ApiError` → use `error.toJSON()` for the response.
- If unknown error → respond with `500 Internal Server Error`.
- In development, include `error.stack` in the response payload.
- Never expose raw error messages from DB or third-party services in production.

## Rules

- Use cases throw named domain errors — never raw `Error` or `ApiError` directly.
- Controllers never throw — always `next(error)`.
- Repositories throw `InternalError` for unexpected DB failures only.
- Never catch and swallow errors silently anywhere in the codebase.
- Never use `console.error` — use `LoggerService` in the error handler.
- Error messages must be human-readable and safe to expose to clients.
