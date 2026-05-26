# File Naming Rules

## Conventions

- Use **kebab-case** for all file and folder names (e.g., `logger.service.ts`, `error-handler.ts`).
- Service files: `<name>.service.ts` (e.g., `logger.service.ts`, `cache.service.ts`).
- Middleware files: `<name>.middleware.ts` (e.g., `error-handler.middleware.ts`).
- Route files: `<name>.routes.ts` (e.g., `health.routes.ts`, `auth.routes.ts`).
- Config files: `index.ts` inside the config folder.
- Interface files: Define interfaces at the top of the service/module file — no separate interface files unless shared across multiple services.

## Rules

- Never use PascalCase or camelCase for file names.
- Folder names are always lowercase kebab-case.
- One file = one primary export (class, router, config object).
