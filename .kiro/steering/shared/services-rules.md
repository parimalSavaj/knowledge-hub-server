---
description: Rules for shared services (singleton pattern, co-located interface/types/service per folder)
inclusion: fileMatch
fileMatchPattern: "src/shared/services/**"
---

# Shared Services Rules

## Location

- All shared services live in `src/shared/services/` — one folder per service.
- These are cross-cutting services used across the entire app (logger, database, jwt, hash, swagger, etc.).

## Structure

Each service gets its own folder containing its interface, types (if needed), and implementation:

```
src/shared/services/
├── logger/
│   ├── logger.service.interface.ts
│   └── logger.service.ts
├── database/
│   ├── database.service.interface.ts
│   ├── database.types.ts
│   └── database.service.ts
├── jwt/
│   ├── jwt.service.interface.ts
│   ├── jwt.types.ts
│   └── jwt.service.ts
├── hash/
│   ├── hash.service.interface.ts
│   └── hash.service.ts
└── swagger/
    ├── swagger.service.interface.ts
    ├── swagger.config.ts
    ├── swagger.schemas.ts
    ├── swagger.service.ts
    └── docs/
```

## Folder Rules

- One folder per service — folder naming: `<name>/` (e.g., `logger/`, `jwt/`, `hash/`).
- Each folder contains at minimum:
  - `<name>.service.interface.ts` — the contract interface.
  - `<name>.service.ts` — the singleton implementation.
- Optionally includes:
  - `<name>.types.ts` — service-related types (payloads, options, configs). Only created when needed.
- No shared `interfaces/` or `types/` folders — everything is co-located within the service folder.

## Service Implementation Rules

- Services must use the **singleton pattern** — private constructor with a static `getInstance()` method.
- Never export a loose instance. Export the class as a named export (`export class`). Consumers call `ClassName.getInstance()`.
- Keep service responsibilities focused. One service = one concern.
- File naming: `<name>.service.ts` (e.g., `logger.service.ts`, `jwt.service.ts`).

## Interface Rules

- Interface lives inside the same folder as its service: `src/shared/services/<name>/<name>.service.interface.ts`.
- Interface name: `I<PascalName>Service` (e.g., `IJwtService`, `IDatabaseService`, `IHashService`).
- Consumers import the interface from the service folder path — `shared/services/<name>/<name>.service.interface`.
- No re-exports — interfaces have one canonical import path.

## Types Rules

- Service-related types live inside the same folder: `src/shared/services/<name>/<name>.types.ts`.
- File naming: `<name>.types.ts` (e.g., `jwt.types.ts`, `database.types.ts`).
- Use `type` keyword (not `interface`) for type definitions.
- Only create a types file when the service has associated types (payloads, options, etc.) — not every service needs one.
- Enums do NOT go here — enums live in `src/domain/enums/`. Types files import enums from there.

## Wiring

- Services are **never instantiated inside `app.ts`**.
- All services are instantiated in `server.ts` via `ClassName.getInstance()` and **passed into `App.create()`** as arguments.
- `App.create()` accepts services typed by their interfaces — it does not import or call `getInstance()` itself.
- This keeps `app.ts` focused on Express wiring and makes dependencies explicit and testable.

## Import Rules

- `server.ts` imports concrete classes from `shared/services/<name>/<name>.service` to call `getInstance()`.
- `app.ts` and all other consumers import only the interface from `shared/services/<name>/<name>.service.interface`.
- Types are imported from `shared/services/<name>/<name>.types` by whoever needs them.

## Import Path Examples

```ts
// server.ts (imports concrete)
import { LoggerService } from './shared/services/logger/logger.service';
import { DatabaseService } from './shared/services/database/database.service';
import { JwtService } from './shared/services/jwt/jwt.service';
import { HashService } from './shared/services/hash/hash.service';

// app.ts and modules (imports interface only)
import { ILoggerService } from './shared/services/logger/logger.service.interface';
import { IDatabaseService } from './shared/services/database/database.service.interface';
import { IJwtService } from './shared/services/jwt/jwt.service.interface';
import { IHashService } from './shared/services/hash/hash.service.interface';

// Use cases importing types
import { JwtPayload } from '../../../shared/services/jwt/jwt.types';
```
