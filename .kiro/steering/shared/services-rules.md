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
src/shared/services/<name>/
├── <name>.service.interface.ts    # Contract interface
├── <name>.types.ts                # Service-related types (optional, only when needed)
└── <name>.service.ts              # Singleton implementation
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

```
server.ts imports:
  → shared/services/<name>/<name>.service     (concrete — calls getInstance())

app.ts and all other consumers import:
  → shared/services/<name>/<name>.service.interface   (interface only)

Use cases importing types:
  → shared/services/<name>/<name>.types
```
