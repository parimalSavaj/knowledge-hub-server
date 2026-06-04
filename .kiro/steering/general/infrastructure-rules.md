---
description: Summary of the infrastructure layer (repositories, external services) — data access, no business logic
inclusion: auto
---

# Infrastructure Layer Rules

## Overview

`src/infrastructure/` is the data access and external integration layer. No business logic — only database queries and third-party API calls.

## Structure

```
src/infrastructure/
├── repositories/          # One folder per entity/table
│   └── <name>/
│       ├── <name>.repository.interface.ts
│       ├── <name>.types.ts
│       └── <name>.repository.ts
└── external-services/     # One folder per third-party service
    └── <name>/
        ├── <name>.external-service.interface.ts
        ├── <name>.types.ts
        └── <name>.external-service.ts
```

## Key Principles

- Repositories return domain entities via a private `toEntity(row)` method that maps snake_case rows to `Entity.create(props)`.
- Row types are plain `type` aliases matching DB columns exactly (snake_case).
- Use cases depend on repository **interfaces** — never concrete classes.
- Never pre-create methods speculatively — add only when a use case needs them.
- All queries filter `WHERE deleted_at IS NULL` for soft-deleted tables.

## Detailed Rules

Loaded via `fileMatch` when editing files in these folders:
- `.kiro/steering/infrastructure/repositories-rules.md`
- `.kiro/steering/infrastructure/external-services-rules.md`
