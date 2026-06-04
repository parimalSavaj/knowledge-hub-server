---
inclusion: auto
---

# Infrastructure Layer Rules

## Overview

`src/infrastructure/` is the data access and external integration layer. It contains two concerns:

1. **Repositories** — all database interaction (raw SQL, no business logic).
2. **External Services** — all third-party API integrations (HTTP calls to outside systems).

Nothing in this folder contains business logic — that belongs in use cases. Infrastructure only knows how to talk to external systems (database, APIs) and return data.

## Folder Structure

```
src/infrastructure/
├── repositories/                  # Database access — one folder per entity/table
│   ├── users/
│   │   ├── users.repository.interface.ts
│   │   ├── users.types.ts
│   │   └── users.repository.ts
│   ├── organizations/
│   │   ├── organizations.repository.interface.ts
│   │   ├── organizations.types.ts
│   │   └── organizations.repository.ts
│   ├── org-members/
│   │   ├── org-members.repository.interface.ts
│   │   ├── org-members.types.ts
│   │   └── org-members.repository.ts
│   └── refresh-tokens/
│       ├── refresh-tokens.repository.interface.ts
│       ├── refresh-tokens.types.ts
│       └── refresh-tokens.repository.ts
│
└── external-services/             # Third-party API integrations — one folder per service
    ├── email/
    │   ├── email.external-service.interface.ts
    │   ├── email.types.ts
    │   └── email.external-service.ts
    └── google-oauth/
        ├── google-oauth.external-service.interface.ts
        ├── google-oauth.types.ts
        └── google-oauth.external-service.ts
```

## General Rules

- Infrastructure never contains business logic — it only fetches, stores, or sends data.
- Use cases depend on infrastructure interfaces — never on concrete implementations.
- Each repository or external service is self-contained in its own folder with interface, types, and implementation co-located.
- No shared `interfaces/` or `types/` folders — everything is co-located per entity/service.
- No `index.ts` barrel files in any infrastructure folder.
- Factories (in modules) are the only place where concrete implementations are instantiated.

## Detailed Rules Per Subfolder

Detailed rules for each subfolder are auto-loaded via `fileMatch` when files in that folder are read or edited:

- **Repositories** (`.kiro/steering/infrastructure/repositories-rules.md`) — Database access classes with raw SQL, `IDatabaseService` dependency, row types, and entity mapping.

- **External Services** (`.kiro/steering/infrastructure/external-services-rules.md`) — Third-party API integration classes with HTTP calls, typed request/response, and service interfaces.

## Import Rules

- Repositories import from: `domain/entities/`, `domain/enums/`, `shared/services/interfaces/` (for `IDatabaseService`).
- External services import from: `domain/entities/`, `domain/enums/`, `shared/services/interfaces/` (for `ILoggerService`), and their own co-located types.
- Nothing in infrastructure imports from `modules/` or `presentation/`.
- Use cases import repository/external-service **interfaces** — never the concrete class directly.
