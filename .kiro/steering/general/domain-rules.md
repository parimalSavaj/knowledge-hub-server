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

- Zero imports from any outer layer — domain is the innermost layer. Entities import only from `domain/enums/` and `domain/value-objects/`.
- Entities have two factories: `static create(props)` for new entities (camelCase props, inline type) and `static fromRecord(row)` for reconstruction from DB rows (snake_case props, inline type). Both parameter types are defined inline — no imported row types from infrastructure.
- Repository calls `Entity.fromRecord(row)` — TypeScript's structural typing ensures the repository's `<Entity>Row` matches the entity's inline row shape without an explicit import.
- Value objects are immutable, no ID, replaceable.
- Enums are string-valued, UPPER_SNAKE_CASE keys, lowercase values matching DB.

## Detailed Rules

Loaded via `fileMatch` when editing files in these folders:
- `.kiro/steering/domain/entities-rules.md`
- `.kiro/steering/domain/enums-rules.md`
- `.kiro/steering/domain/value-objects-rules.md`
