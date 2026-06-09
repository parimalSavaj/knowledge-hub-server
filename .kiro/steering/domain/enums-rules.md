---
description: Rules for domain enums (string-valued, UPPER_SNAKE_CASE keys, one per file)
inclusion: fileMatch
fileMatchPattern: "src/domain/enums/**"
---

# Enum Rules

## Location

- All shared enums live in `src/domain/enums/` — one file per enum.
- File naming: `<name>.enum.ts` (e.g., `org-role.enum.ts`, `auth-provider.enum.ts`).

## Structure

```ts
export enum <PascalName> {
  <UPPER_SNAKE_KEY> = '<lowercase_db_value>',
  <UPPER_SNAKE_KEY> = '<lowercase_db_value>',
  // ...
}
```

## Rules

- Use string-valued enums — never numeric enums. Values must match what is stored in the database.
- Enum keys are UPPER_SNAKE_CASE, values are lowercase matching the DB `CHECK` constraint values.
- One enum per file — no multi-enum files.
- Enums live only in `src/domain/enums/` — never in `shared/`, `infrastructure/`, or module-level folders.
- Enums are imported by entities, value objects, repositories, use cases, and validation schemas — they are the shared vocabulary.
- When adding a new enum value, also update the corresponding DB `CHECK` constraint via a new migration.
- Never use `z.nativeEnum()` in validation schemas — use `z.enum([...])` with explicit values to keep validation independent of the TypeScript enum.

## Enums in This Project

| Enum | File | Values | Used By |
|---|---|---|---|
| `OrgRole` | `org-role.enum.ts` | `owner`, `admin`, `member`, `viewer` | `org_members.role` column, JWT payload, auth middleware |
| `AuthProvider` | `auth-provider.enum.ts` | `local`, `google` | `users.auth_provider` column |
