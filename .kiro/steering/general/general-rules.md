---
description: Cross-cutting TypeScript and coding standards applied to all files
inclusion: auto
---

# General Rules

- Use TypeScript strict mode.
- No `any` type — use proper typing or `unknown` if type is uncertain.
- Use `import/export` (ES modules syntax with CommonJS compilation).
- All config values come from `src/shared/config/index.ts` — never read `process.env` directly elsewhere.
- Use the `LoggerService` for all logging — no `console.log` in production code.
- **Use normal dash (`-`) in all code** — error messages, log messages, comments, and string literals must use a normal hyphen-minus (`-`), never an em dash (`—`) or en dash (`–`). Em dashes are only acceptable in markdown documentation files (`.md`), never in `.ts` source files.

## After Every Change

After making any code change — moving files, updating imports, refactoring, adding new files — always run:

```bash
npx tsc --noEmit
```

This must pass with zero errors before the change is considered done. Never leave broken imports or type errors behind.
