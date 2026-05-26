# Folder Structure Rules

## Project Layout

```
src/
├── shared/              # Shared across the entire app
│   ├── config/          # App configuration (env, constants)
│   ├── services/        # Shared services (logger, etc.)
│   └── middlewares/     # Global middlewares (errorHandler, etc.)
├── routes/              # API route definitions
├── app.ts               # Express app setup
└── server.ts            # Server entry point
```

## Rules

- `shared/` contains everything that is used across multiple parts of the app — config, services, middlewares.
- Never put feature-specific code inside `shared/`. Only cross-cutting concerns belong there.
- Import from shared using relative paths like `../shared/services/logger.service`.
- Feature modules (added later) will sit alongside `shared/` at the `src/` level (e.g., `src/users/`, `src/auth/`).
