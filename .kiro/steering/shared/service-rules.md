# Shared Service Rules

## Location

- All shared services live in `src/shared/services/`.
- These are cross-cutting services used across the entire app (logger, cache, etc.).

## Structure

- Every service must have an **interface** defined at the top of the service file.
- The interface must be exported and used wherever the service is consumed (type the variable with the interface, not the class).
- Services must use the **singleton pattern** — private constructor with a static `getInstance()` method.
- Never export a loose instance. Export the class as a named export (`export class`). Consumers call `ClassName.getInstance()`.
- Keep service responsibilities focused. One service = one concern.

## Wiring

- Services are **never instantiated inside `app.ts`**.
- All services are instantiated in `server.ts` via `ClassName.getInstance()` and **passed into `App.create()`** as arguments.
- `App.create()` accepts services as parameters and stores them — it does not import or call `getInstance()` itself.
- This keeps `app.ts` focused on Express wiring and makes dependencies explicit and testable.
