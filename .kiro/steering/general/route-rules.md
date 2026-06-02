# Route Rules

## Two types of routes

### 1. System routes — `src/modules/system/`
- For server-level routes with no business logic and no DB access (e.g., `health.routes.ts`).
- Files sit flat inside `modules/system/` — no `application/` or `presentation/` subfolders.
- Registered in `app.ts` under `initializePublicRoutes()`.
- File naming: `<name>.routes.ts` (e.g., `health.routes.ts`).

### 2. Feature routes — `src/modules/<name>/presentation/`
- For all domain/business routes (e.g., `users`, `auth`, `documents`).
- File naming: `<name>.routes.ts` (e.g., `users.routes.ts`, `auth.routes.ts`).
- Registered in `app.ts` under `initializeProtectedRoutes()` (or public if unauthenticated).

## Rules

- No `index.ts` file in any routes folder.
- All routes are registered directly in `app.ts` — never auto-discovered.
- Every route file exports a class with a `getRouter()` method — consistent across system and feature routes.
- Route files only define the router and delegate to the controller — no business logic in route files.
- Controllers handle request/response. Use cases handle business logic. Keep them separate.
- Add route constants to `src/shared/constants/route.constants.ts` for every new route prefix.
