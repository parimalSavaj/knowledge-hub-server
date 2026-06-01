# Route Rules

## Structure

- No `index.ts` file inside the `routes/` folder.
- All routes are registered directly in `app.ts`.
- Route files follow the naming pattern: `<name>.routes.ts` (e.g., `health.routes.ts`, `auth.routes.ts`).
- Each route file exports a single router as default.

## Route Constants (`src/shared/constants/route.constants.ts`)

- Two separate exports exist: `ROUTE_PREFIXES` and `ROUTES`.
- **`ROUTE_PREFIXES`** — contains mount-point paths used only in `app.ts` for wiring routers (e.g., `BASE_PATH`, `DOCS`, `HEALTH`). No route file should import this.
- **`ROUTES`** — contains feature-specific endpoint paths grouped by module. Each group must include a `ROOT: "/"` key for the base endpoint. Route files import only `ROUTES` and access their own group (e.g., `ROUTES.HEALTH.ROOT`, `ROUTES.HEALTH.ERROR`).
- Never hardcode path strings in route files — always use constants from `ROUTES`.
- When adding a new feature, add its mount prefix to `ROUTE_PREFIXES` and its endpoint paths as a new group in `ROUTES`.
