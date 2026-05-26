# General Rules

- Use TypeScript strict mode.
- No `any` type — use proper typing or `unknown` if type is uncertain.
- Use `import/export` (ES modules syntax with CommonJS compilation).
- All config values come from `src/shared/config/index.ts` — never read `process.env` directly elsewhere.
- Use the `LoggerService` for all logging — no `console.log` in production code.
