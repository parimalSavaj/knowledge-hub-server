---
inclusion: auto
---

# Domain Layer Rules

## Overview

`src/domain/` is the purest layer in the application — it contains entities, value objects, enums, and domain errors. Nothing in this folder imports from `infrastructure/`, `modules/`, or `shared/services/`.

## Folder Structure

```
src/domain/
├── entities/        # Entity classes — aggregate roots with business logic
│   ├── user.entity.ts
│   └── organization.entity.ts
├── value-objects/   # Immutable objects that describe entity attributes
│   ├── user-membership.value-object.ts
│   └── org-member.value-object.ts
├── enums/           # Shared TypeScript enums
│   └── org-role.enum.ts
└── errors/          # Domain-level errors (no HTTP codes)
    └── domain-errors.ts
```

## General Rules

- The lowest layer — zero imports from any other `src/` folder.
- No `types/` folder in domain — types live at the layer that owns them (`shared/services/types/`, `infrastructure/repositories/types/`, or module-level `types/`).
- No business logic leaks upward — use cases call entity methods, never mutate entity state directly.
- Entities and value objects are the only place where domain invariants are enforced.

## Detailed Rules Per Subfolder

Before making any change inside `src/domain/`, read the specific rules file for that subfolder first.

- **Entities** (`.kiro/steering/domain/entities-rules.md`) — Aggregate roots with private constructors, `fromRecord()` factory, readonly getters, and business methods that enforce invariants.

- **Value Objects** (`.kiro/steering/domain/value-objects-rules.md`) — Immutable, no IDs, replaceable. Used inside entities to describe related data.

- **Enums** (`.kiro/steering/domain/enums-rules.md`) — Shared TypeScript enums used across domain and infrastructure layers.
