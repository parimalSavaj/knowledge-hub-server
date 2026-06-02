---
inclusion: auto
---

# Shared Layer Rules

## Overview

`src/shared/` contains cross-cutting concerns used across the entire app. Nothing feature-specific or business-logic-related lives here.

## Folder Structure

```
src/shared/
├── @types/          # Type augmentations for third-party libraries (.d.ts files only)
├── config/          # App configuration (env vars parsed with Zod)
├── constants/       # Shared constants (route prefixes, status codes)
├── core/            # HTTP primitives (ApiError, ApiResponse, ErrorHandler)
├── middlewares/     # Global middlewares (auth, validate, rate-limit)
└── services/        # Shared services (logger, database, jwt, swagger)
    ├── interfaces/  # Service contract interfaces — one file per service
    ├── types/       # Service-related types — one file per service/concern
    └── *.service.ts # Service implementations
```

## General Rules

- Never put feature-specific or business logic inside `shared/`.
- No routes inside `shared/` — all routes live inside `modules/`.
- Import from shared using relative paths (e.g., `../../shared/services/interfaces/logger.service.interface`).
- Enums do NOT live here — all enums live in `src/domain/enums/`.

## Detailed Rules Per Subfolder

Before making any change inside `src/shared/`, read the specific rules file for that subfolder first.

- **Services** (`.kiro/steering/shared/services-rules.md`) — Singleton services, interfaces in `interfaces/`, types in `types/`, wiring via `server.ts` → `App.create()`.

- **Core** (`.kiro/steering/shared/core-rules.md`) — ApiError subclasses, ApiResponse wrapper, global ErrorHandler. All in one folder, no sub-splitting.

- **Config** (`.kiro/steering/shared/config-rules.md`) — Single `config/index.ts` validated with Zod at boot. Only place that reads `process.env`.

- **Middlewares** (`.kiro/steering/shared/middlewares-rules.md`) — Auth, role, and validate middlewares. Plain functions, no business logic.

- **@types** (`.kiro/steering/shared/types-rules.md`) — `.d.ts` augmentations for third-party libraries only (e.g., extending Express Request).
