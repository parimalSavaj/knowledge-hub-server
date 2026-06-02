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

## Column Type Standards

- Always use `TIMESTAMPTZ` (not `TIMESTAMP`) for all timestamp columns — `TIMESTAMP` has no timezone awareness and causes bugs in any environment that is not strictly UTC.
- Use `TEXT` instead of `VARCHAR(n)` for variable-length strings with no meaningful upper bound (e.g. tokens, URLs, descriptions). Use `VARCHAR(n)` only when the length limit is a real business constraint (e.g. `name VARCHAR(100)`).

## Constraints

- Add a `CHECK` constraint for any column that has a fixed set of valid values (e.g. roles, statuses, types). This enforces correctness at the DB level regardless of how data is inserted.
- Define all `CHECK` constraints inline with the column or as a named table constraint in the same migration.

```sql
-- inline
role VARCHAR(50) NOT NULL DEFAULT 'member'
  CONSTRAINT org_members_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'viewer'))

-- or as named table constraint
CONSTRAINT org_members_role_check CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
```

## Soft Delete

All business data tables use soft delete — rows are never physically removed.

- Add `deleted_at TIMESTAMPTZ NULL` to every business table (`users`, `organizations`, `org_members`, etc.).
- `deleted_at IS NULL` means the record is active. `deleted_at IS NOT NULL` means it is soft-deleted.
- Never add `deleted_at` to audit/security tables like `refresh_tokens` or `migrations` — those use hard delete or revocation flags.
- Replace column-level `UNIQUE` constraints with partial unique indexes `WHERE deleted_at IS NULL` so that deleted records do not block reuse of unique values (e.g. a deleted user's email can be re-registered).

```sql
-- Instead of: email VARCHAR(255) NOT NULL UNIQUE
email VARCHAR(255) NOT NULL,
-- ...
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active
  ON users (email)
  WHERE deleted_at IS NULL;
```

- Application queries must always filter `WHERE deleted_at IS NULL` — repositories are responsible for this, never the use case.



Add indexes in the same migration file as the table creation. Do not create a separate migration just for indexes unless adding them to an existing table.

Rules:
- Every foreign key column must have an index — PostgreSQL does not create them automatically.
- Every column used in a `WHERE`, `ORDER BY`, or `JOIN` clause in the application must have an index.
- Use partial indexes (`WHERE` clause) when only a subset of rows is queried (e.g. active tokens, non-deleted records).
- Always use `IF NOT EXISTS` on index creation for idempotency.
- Name indexes consistently: `idx_{table}_{column(s)}` or `idx_{table}_{description}` for partial indexes.

```sql
-- FK index
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);

-- Partial index — only unrevoked tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON refresh_tokens (expires_at)
  WHERE NOT revoked;
```

Note: `UNIQUE` constraints automatically create an index — no need to add one manually for unique columns.

### Example Migration

```sql
-- Migration: create-users-table
-- Created at: 2026-06-01T12:00:00.000Z

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(50) NOT NULL DEFAULT 'user'
                CONSTRAINT users_role_check
                CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
- Every business table must have `created_at`, `updated_at`, and `deleted_at` columns using `TIMESTAMPTZ`.
- Foreign key constraints must be defined in the same migration as the dependent table.
- Foreign key columns must have an index in the same migration.
- Columns with a fixed set of valid values must have a `CHECK` constraint.
