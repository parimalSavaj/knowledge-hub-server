---
description: Summary of the domain layer (entities, enums, value objects) — pure, no outward imports
inclusion: auto
---

# Domain Layer Rules

## Overview

`src/domain/` is the purest layer — entities, value objects, enums. Nothing in this folder imports from `infrastructure/`, `modules/`, or `shared/`.

## Structure

```
src/domain/
├── entities/        # Entity classes with private constructor + static create(props)
├── value-objects/   # Immutable objects describing entity attributes
├── enums/           # Shared TypeScript string enums
└── errors/          # Domain-level errors (no HTTP codes)
```

## Key Principles

- Zero imports from any outer layer — domain is the innermost layer.
- Entities use `static create(props)` factory — props are camelCase, defined inline. No infrastructure imports.
- Repository does the mapping from DB row (snake_case) → entity props (camelCase).
- Value objects are immutable, no ID, replaceable.
- Enums are string-valued, UPPER_SNAKE_CASE keys, lowercase values matching DB.

## Detailed Rules

Loaded via `fileMatch` when editing files in these folders:
- `.kiro/steering/domain/entities-rules.md`
- `.kiro/steering/domain/enums-rules.md`
- `.kiro/steering/domain/value-objects-rules.md`
