# Folder Structure Rules

## Project Layout

```
src/
├── shared/                        # Cross-cutting concerns used across the entire app
│   ├── config/                    # App configuration (env vars, constants)
│   ├── services/                  # Shared services (logger, database, swagger)
│   ├── middlewares/               # Global middlewares (auth, rate-limit, etc.)
│   └── core/                      # HTTP primitives (ApiError, ApiResponse, ErrorHandler)
│
├── domain/                        # All domain-level contracts and shapes
│   ├── types/                     # Plain types, enums, primitives — one file per domain
│   │   ├── user.types.ts
│   │   ├── organization.types.ts
│   │   └── document.types.ts
│   ├── interfaces/                # All interface contracts — repo, services, external
│   │   ├── users.repository.interface.ts
│   │   └── document.repository.interface.ts
│   └── entities/                  # Entity class/object shapes (DB row representations)
│       ├── user.entity.ts
│       └── document.entity.ts
│
├── infrastructure/                # Data access layer
│   └── repositories/              # Raw SQL implementations
│       ├── users.repository.ts
│       └── document.repository.ts
│
├── modules/                       # All modules — system and feature
│   ├── system/                    # System-level routes (no business logic, no DB)
│   │   └── health.routes.ts       # Flat — no subfolders
│   │
│   ├── users/                     # Feature module example
│   │   ├── users.factory.ts       # Module root — wires repo + use cases → creates controller
│   │   ├── application/           # Business logic only
│   │   │   ├── dtos/              # One file per use case, both DTOs inside
│   │   │   │   ├── create-user.dto.ts   # exports CreateUserRequestDto + CreateUserResponseDto
│   │   │   │   └── get-user.dto.ts      # exports GetUserRequestDto + GetUserResponseDto
│   │   │   ├── create-user.use-case.ts
│   │   │   └── get-user.use-case.ts
│   │   └── presentation/          # HTTP layer
│   │       ├── users.routes.ts
│   │       ├── users.controller.ts
│   │       └── users.validation.ts
│   │
│   └── auth/                      # Another feature module example
│       ├── auth.factory.ts
│       ├── application/
│       │   ├── dtos/
│       │   │   └── login.dto.ts   # exports LoginRequestDto + LoginResponseDto
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

### `shared/`
- Contains only cross-cutting concerns used across multiple parts of the app.
- Never put feature-specific or business logic inside `shared/`.
- No routes inside `shared/` — all routes live inside `modules/`.
- Import from shared using relative paths like `../shared/services/logger.service`.

### `domain/`
- Contains all domain-level contracts and shapes. Three subfolders only:
  - `types/` — plain TypeScript types, enums, primitives. One file per domain (e.g., `user.types.ts`). No classes, no methods.
  - `interfaces/` — all interface contracts including repository interfaces, external service interfaces. One file per domain (e.g., `users.repository.interface.ts`).
  - `entities/` — entity shapes that represent DB row structures. One file per domain (e.g., `user.entity.ts`). No business logic.
- Nothing in `domain/` imports from `infrastructure/`, `modules/`, or `shared/services/`.
- `domain/` is the lowest layer — it has no dependencies on other src folders.

### `infrastructure/`
- Contains all database interaction code.
- `repositories/` — raw SQL implementations. One file per entity.
- Implementations import their interface contract from `domain/interfaces/`.
- No business logic here — only data access (SELECT, INSERT, UPDATE, DELETE).

### `modules/`
- Every route in the app lives inside `modules/` — no exceptions.
- `modules/system/` — system-level routes only (health, ping, status). Flat, no subfolders.
- Feature modules (e.g., `users`, `auth`, `documents`) have exactly this structure:
  - `<name>.factory.ts` — at module root. Wires repo + use cases → creates and returns controller. Only consumer is the routes file.
  - `application/` — use cases and DTOs only. No controller, no repo imports.
  - `application/dtos/` — one file per use case. Each file exports both the request and response DTO for that use case (e.g., `create-user.dto.ts` exports `CreateUserRequestDto` and `CreateUserResponseDto`).
  - `presentation/` — routes, controller, validation. One file each per module.
- Factory sits at module root because it imports across all layers (repo, use cases, controller) — it is the composition root for the module.
- `application/` must stay pure — only use cases and DTOs, never imports controller or repository directly.
- Modules never import from another module's folder directly.
- If a module needs data from another domain, it imports from `domain/interfaces/` — never from another module's folder.

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
  → domain/interfaces   (never infrastructure/repositories directly)
  → domain/types
  → domain/entities

infrastructure/repositories
  → domain/interfaces   (implements the contract)
  → domain/entities
```
- `application/` never imports from `presentation/` or `infrastructure/repositories/`.
- `factory` is the only file allowed to import across all layers within a module.
- `domain/` has zero imports from any other src folder — it is the base layer.
- Never import upward or sideways between modules.
- `domain/` and `infrastructure/` are the only shared data-layer imports across modules.
