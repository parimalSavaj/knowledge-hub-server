# Route Rules

## Structure

- No `index.ts` file inside the `routes/` folder.
- All routes are registered directly in `app.ts`.
- Route files follow the naming pattern: `<name>.routes.ts` (e.g., `health.routes.ts`, `auth.routes.ts`).
- Each route file exports a single router as default.
