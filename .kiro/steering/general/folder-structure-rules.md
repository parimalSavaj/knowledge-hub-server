---
description: High-level project layout showing all folders, files, and import direction rules
inclusion: auto
---

# Folder Structure Rules

## Project Layout

```
src/
├── shared/                        # Cross-cutting concerns used across the entire app
│   ├── @types/                    # Type augmentations for third-party libraries (.d.ts files)
│   ├── config/                    # App configuration (env vars, constants)
│   ├── constants/                 # Shared constants (route prefixes, status codes)
│   ├── services/                  # Shared services (logger, database, swagger, jwt)
│   │   ├── interfaces/            # Service contract interfaces — one file per service
│   │   │   ├── logger.service.interface.ts
│   │   │   ├── database.service.interface.ts
│   │   │   └── jwt.service.interface.ts
│   │   ├── types/                 # Service-related types — one file per service/concern
│   │   │   ├── database.types.ts
│   │   │   └── jwt.types.ts
│   │   ├── logger.service.ts
│   │   ├── database.service.ts
│   │   ├── jwt.service.ts
│   │   └── swagger/
│   ├── middlewares/               # Global middlewares (auth, rate-limit, etc.)
│   └── core/                      # HTTP primitives (ApiError, ApiResponse, ErrorHandler)
│
├── domain/                        # Pure domain layer — entities, enums, value objects, errors
│   ├── entities/                  # Entity classes — aggregate roots with business logic
│   │   ├── user.entity.ts
│   │   └── organization.entity.ts
│   ├── enums/                     # Shared enums
│   │   ├── org-role.enum.ts
│   │   └── auth-provider.enum.ts
│   ├── value-objects/             # Immutable objects describing entity attributes
│   │   ├── user-membership.value-object.ts
│   │   └── org-member.value-object.ts
│   └── errors/                    # Domain-level errors (no HTTP codes)
│       └── domain-errors.ts
│
├── infrastructure/                # Data access and external integration layer
│   ├── repositories/              # Database access — one folder per entity/table
│   │   ├── users/
│   │   │   ├── users.repository.interface.ts
│   │   │   ├── users.types.ts
│   │   │   └── users.repository.ts
│   │   ├── organizations/
│   │   │   ├── organizations.repository.interface.ts
│   │   │   ├── organizations.types.ts
│   │   │   └── organizations.repository.ts
│   │
│   └── external-services/         # Third-party API integrations — one folder per service
│       └── <service-name>/
│           ├── <name>.external-service.interface.ts
│           ├── <name>.types.ts
│           └── <name>.external-service.ts
│
├── modules/                       # All modules — system and feature
│   ├── system/                    # System-level routes (no business logic, no DB)
│   │   └── health.routes.ts       # Flat — no subfolders
│   │
│   ├── users/                     # Feature module example
│   │   ├── users.factory.ts
│   │   ├── interfaces/            # Module-specific interfaces (if needed)
│   │   ├── types/                 # Module-specific types (if needed)
│   │   ├── application/
│   │   │   ├── dtos/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── get-user.dto.ts
│   │   │   ├── create-user.use-case.ts
│   │   │   └── get-user.use-case.ts
│   │   └── presentation/
│   │       ├── users.routes.ts
│   │       ├── users.controller.ts
│   │       └── users.validation.ts
│   │
│   └── auth/
│       ├── auth.factory.ts
│       ├── interfaces/            # Module-specific interfaces (if needed)
│       ├── types/                 # Module-specific types (if needed)
│       ├── application/
│       │   ├── dtos/
│       │   │   └── login.dto.ts
│       │   └── login.use-case.ts
│       └── presentation/
│           ├── auth.routes.ts
│           ├── auth.controller.ts
│           └── auth.validation.ts
│
├── app.ts                         # Express app setup
└── server.ts                      # Server entry point
```

## Rules

### `domain/`
- The lowest layer — nothing in `domain/` imports from `infrastructure/`, `modules/`, or `shared/services/`.
- For detailed rules, see `.kiro/steering/domain/` — entities, value objects, and enums each have their own rules file.

### `infrastructure/`
- Contains all database interaction and external API integration code — no business logic.
- For detailed rules, see `.kiro/steering/infrastructure/` — repositories and external services each have their own rules file.
- `repositories/` — one folder per entity/table, each containing:
  - `<name>.repository.interface.ts` — contract. Imports only from `domain/`.
  - `<name>.types.ts` — raw DB row type. Plain `type` alias.
  - `<name>.repository.ts` — implementation. Each:
    - Imports its co-located interface and row type.
    - Has `private readonly TABLE = '<table_name>'` used in all SQL strings.
    - Has `constructor(private readonly db: IDatabaseService)`.
    - Never accepts a `PoolClient` parameter — transaction control belongs in use cases.
- `external-services/` — one folder per third-party service, each containing:
  - `<name>.external-service.interface.ts` — contract. Use cases depend on this.
  - `<name>.types.ts` — request/response types for the external API.
  - `<name>.external-service.ts` — implementation (HTTP calls).

### `modules/`
- Every route in the app lives inside `modules/` — no exceptions.
- `modules/system/` — system-level routes only (health, ping, status). Flat, no subfolders.
- Feature modules have exactly this structure:
  - `<name>.factory.ts` — at module root. Wires repo + use cases → creates and returns controller.
  - `interfaces/` — module-specific interfaces, only created when the module needs them.
  - `types/` — module-specific types, only created when the module needs them.
  - `application/` — use cases and DTOs only.
  - `application/dtos/` — one file per use case, exports both request and response DTO.
  - `presentation/` — routes, controller, validation. One file each.
- `application/` must stay pure — only use cases and DTOs, never imports controller or repository directly.
- Modules never import from another module's folder directly.

### Import direction (strict)
```
factory (module root)
  → presentation/controller
  → application/use-cases
  → infrastructure/repositories/<entity>/
  → infrastructure/external-services/<service>/

presentation/routes
  → factory
  → presentation/validation

application/use-cases
  → infrastructure/repositories/<entity>/<entity>.repository.interface   (never the concrete class)
  → infrastructure/repositories/<entity>/<entity>.types                  (row types, only when needed for transactions)
  → infrastructure/external-services/<service>/<service>.external-service.interface  (never the concrete class)
  → shared/services/types/                                               (service-related types like jwt.types.ts)
  → domain/entities
  → domain/enums

infrastructure/repositories/<entity>/<entity>.repository.ts
  → ./<entity>.repository.interface   (co-located)
  → ./<entity>.types                  (co-located)
  → domain/entities
  → domain/enums

infrastructure/external-services/<service>/<service>.external-service.ts
  → ./<service>.external-service.interface   (co-located)
  → ./<service>.types                        (co-located)
  → shared/services/interfaces/              (for ILoggerService)
  → shared/config/
  → domain/enums
```
- `application/` never imports from `presentation/` or the concrete `*.repository.ts` files.
- `factory` is the only file allowed to import across all layers within a module.
- `domain/` has zero imports from any other src folder — it is the base layer.
- Never import upward or sideways between modules.
- Modules needing shared data import from `domain/` or `infrastructure/repositories/` interfaces — never from another module's folder.
