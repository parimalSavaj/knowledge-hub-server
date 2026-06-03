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
├── infrastructure/                # Data access layer
│   └── repositories/              # Everything for a repository lives together in one folder
│       ├── interfaces/            # Repository contract interfaces — one file per entity
│       │   ├── users.repository.interface.ts
│       │   ├── organizations.repository.interface.ts
│       │   ├── org-members.repository.interface.ts
│       │   └── refresh-tokens.repository.interface.ts
│       ├── types/                 # Raw DB row types — one file per entity
│       │   ├── users.types.ts
│       │   ├── organizations.types.ts
│       │   ├── org-members.types.ts
│       │   └── refresh-tokens.types.ts
│       ├── users.repository.ts               # Implementation
│       ├── organizations.repository.ts
│       ├── org-members.repository.ts
│       └── refresh-tokens.repository.ts
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
- Contains all database interaction code — raw SQL only, no business logic.
- `repositories/` has three parts:
  - `interfaces/` — one `<entity>.repository.interface.ts` per entity. Imports only from `domain/`.
  - `types/` — one `<entity>.types.ts` per entity. Raw DB row `type` aliases. Imports only from `domain/`.
  - `*.repository.ts` (flat) — implementations. Each:
    - Imports its interface from `./interfaces/` and its row type from `./types/`.
    - Has `private readonly TABLE = '<table_name>'` used in all SQL strings.
    - Has `constructor(private readonly db: IDatabaseService)`.
    - Never accepts a `PoolClient` parameter — transaction control belongs in use cases.

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
  → infrastructure/repositories

presentation/routes
  → factory
  → presentation/validation

application/use-cases
  → infrastructure/repositories/interfaces/<entity>.repository.interface   (never the concrete class)
  → infrastructure/repositories/types/<entity>.types                       (row types, only when needed for transactions)
  → shared/services/types/                                                 (service-related types like jwt.types.ts)
  → domain/entities
  → domain/enums

infrastructure/repositories/<entity>.repository.ts
  → ./interfaces/<entity>.repository.interface   (same folder)
  → ./types/<entity>.types                       (same folder)
  → domain/entities
  → domain/enums
```
- `application/` never imports from `presentation/` or the concrete `*.repository.ts` files.
- `factory` is the only file allowed to import across all layers within a module.
- `domain/` has zero imports from any other src folder — it is the base layer.
- Never import upward or sideways between modules.
- Modules needing shared data import from `domain/` or `infrastructure/repositories/` interfaces — never from another module's folder.
