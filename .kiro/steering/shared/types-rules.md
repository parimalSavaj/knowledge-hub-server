---
description: Rules for third-party type augmentations (.d.ts declaration files)
inclusion: fileMatch
fileMatchPattern: "src/shared/@types/**"
---

# Shared @types Rules

## Location

- Third-party type augmentations live in `src/shared/@types/`.
- This folder contains only `.d.ts` declaration files that extend external library types.

## Files

- `express.d.ts` — extends Express `Request` to include `user?: AuthenticatedUser`.

## Rules

- Only `.d.ts` files go here — never regular `.ts` implementation files.
- Each file augments one third-party library's types.
- File naming: `<library-name>.d.ts` (e.g., `express.d.ts`).
- These files are picked up automatically by TypeScript via the `include: ["src/**/*"]` in `tsconfig.json`.
- Never put business types, service types, or domain types here — those live in their respective `types/` folders.
- This folder is for framework/global type augmentations only.
