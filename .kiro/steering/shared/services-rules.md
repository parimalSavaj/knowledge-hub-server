---
description: Rules for shared services (singleton pattern, interfaces, types, wiring)
inclusion: fileMatch
fileMatchPattern: "src/shared/services/**"
---

# Shared Services Rules

## Location

- All shared services live in `src/shared/services/`.
- These are cross-cutting services used across the entire app (logger, database, jwt, swagger, etc.).

## Structure

- Services must use the **singleton pattern** — private constructor with a static `getInstance()` method.
- Never export a loose instance. Export the class as a named export (`export class`). Consumers call `ClassName.getInstance()`.
- Keep service responsibilities focused. One service = one concern.
- File naming: `<name>.service.ts` (e.g., `logger.service.ts`, `jwt.service.ts`).

## Interfaces

- Service interfaces live in `src/shared/services/interfaces/` — one file per service.
- File naming: `<name>.service.interface.ts` (e.g., `jwt.service.interface.ts`, `database.service.interface.ts`).
- The service implementation imports its interface from `./interfaces/`.
- Consumers always import the interface from `shared/services/interfaces/` — never from the service file.
- No re-exports of interfaces from service files — interfaces have one canonical import path.

## Types

- Service-related types (payloads, options, configs, etc.) live in `src/shared/services/types/` — one file per service or concern.
- File naming: `<name>.types.ts` (e.g., `jwt.types.ts`, `database.types.ts`).
- Use `type` keyword (not `interface`) for type definitions in these files.
- Enums do NOT go here — enums live in `src/domain/enums/`. Types files import enums from there.

## Wiring

- Services are **never instantiated inside `app.ts`**.
- All services are instantiated in `server.ts` via `ClassName.getInstance()` and **passed into `App.create()`** as arguments.
- `App.create()` accepts services typed by their interfaces — it does not import or call `getInstance()` itself.
- This keeps `app.ts` focused on Express wiring and makes dependencies explicit and testable.

## Import Rules

- `server.ts` imports concrete classes to call `getInstance()`.
- `app.ts` and all other consumers import only the interface from `shared/services/interfaces/`.
- Types are imported from `shared/services/types/` by whoever needs them.
