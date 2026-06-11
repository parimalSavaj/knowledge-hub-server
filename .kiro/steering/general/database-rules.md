---
description: Summary of database rules (migrations, seeding, column standards, soft delete)
inclusion: auto
---

# Database Rules

## Overview

Database schema changes are managed through plain SQL migration files in `migrations/` at the project root.

## Key Principles

- Always use the script to create migrations: `npm run db:create-migration <description>`.
- File naming: `{YYYYMMDDHHmmss}_{kebab-case-description}.sql`.
- Migrations are idempotent (`IF NOT EXISTS`), run in transactions, append-only.
- Add timestamp columns based on the table's actual needs:
  - `created_at` — add when "when was this record created" is meaningful. Use a domain-specific name when it communicates better (e.g., `joined_at` for membership tables).
  - `updated_at` — add when rows are mutable (role changes, profile updates). Skip for rows that never change after creation.
  - `deleted_at` — add when the table needs soft delete (preserving history, allowing restoration). Skip when hard delete or CASCADE is the correct behavior.
- Soft delete via `deleted_at` — repositories handle `WHERE deleted_at IS NULL`.
- Every FK column gets an index. Every `WHERE`/`ORDER BY` column gets an index.
- Seeds are dev-only, idempotent, inside a transaction.

## Detailed Rules

Loaded via `fileMatch` when editing migration files:
- `.kiro/steering/database/migration-rules.md`
