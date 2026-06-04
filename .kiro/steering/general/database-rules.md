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
- All business tables have `created_at`, `updated_at`, `deleted_at` (TIMESTAMPTZ).
- Soft delete via `deleted_at` — repositories handle `WHERE deleted_at IS NULL`.
- Every FK column gets an index. Every `WHERE`/`ORDER BY` column gets an index.
- Seeds are dev-only, idempotent, inside a transaction.

## Detailed Rules

Loaded via `fileMatch` when editing migration files:
- `.kiro/steering/database/migration-rules.md`
