# Migration & Seeding Rules

## Overview

Database schema changes are managed through plain SQL migration files. The migration runner tracks which files have been applied and runs only pending ones.

## Migration Files

All migration files live in `migrations/` at the project root.

### Naming Convention

```
{timestamp}_{kebab-case-description}.sql
```

Examples:
```
20260527183010_create-migrations-table.sql
20260601120000_create-users-table.sql
20260601130000_add-role-to-users.sql
```

- Timestamp format: `YYYYMMDDHHmmss` — always 14 digits.
- Description: kebab-case, describes what the migration does.
- Never rename a migration file after it has been applied to any environment.

### Creating a Migration

Always use the script — never create migration files manually:

```bash
npm run db:create-migration <description>
# Example:
npm run db:create-migration create-users-table
```

This generates a timestamped file in `migrations/` with a blank template.

## Migration File Rules

- Each migration file must be **idempotent** where possible — use `IF NOT EXISTS`, `IF EXISTS`, `ON CONFLICT DO NOTHING`.
- Each migration runs inside a transaction — if it fails, it rolls back automatically.
- Never modify an existing migration file that has already been applied.
- One concern per migration — don't combine unrelated schema changes in one file.
- Always include `RETURNING` in INSERT statements when the result is needed.

### Example Migration

```sql
-- Migration: create-users-table
-- Created at: 2026-06-01T12:00:00.000Z

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Running Migrations

```bash
npm run db:migrate
```

The runner:
1. Validates all required env vars are present.
2. Verifies DB connection.
3. Bootstraps the `migrations` tracking table if it doesn't exist.
4. Runs all pending `.sql` files in timestamp order.
5. Records each applied migration in the `migrations` table.

## Seeding Rules

Seeds live in `scripts/database/seed.ts`.

- Seeds are for **development and testing only** — never run in production (the script guards against this).
- Seed data must be idempotent — use `ON CONFLICT DO NOTHING` or check before inserting.
- Seeds run inside a single transaction — all succeed or all roll back.
- Never put real user data or production data in seed files.
- Keep seeds minimal — only what's needed to develop and test features locally.

```bash
npm run db:seed
```

## Rules

- Never write raw SQL schema changes directly in the DB — always use a migration file.
- Never run `db:seed` in production — the script will exit with an error if `NODE_ENV=production`.
- Migration files are append-only — never edit or delete an applied migration.
- Every table must have `created_at` and `updated_at` timestamp columns.
- Foreign key constraints must be defined in the same migration as the dependent table.
