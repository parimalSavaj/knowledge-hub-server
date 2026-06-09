---
description: Summary of the shared layer (services, core, config, middlewares) — cross-cutting concerns
inclusion: auto
---

# Shared Layer Rules

## Overview

`src/shared/` contains cross-cutting concerns used across the entire app. Nothing feature-specific lives here.

## Structure

```
src/shared/
├── @types/          # .d.ts augmentations for third-party libraries
├── config/          # App configuration (env vars parsed with Zod)
├── constants/       # Shared constants (route prefixes, status codes)
├── core/            # HTTP primitives (ApiError, ApiResponse, ErrorHandler)
├── middlewares/     # Global middlewares (auth, validate, role)
└── services/        # Shared services — one folder per service
    ├── logger/      # interface + implementation
    ├── database/    # interface + types + implementation
    ├── jwt/         # interface + types + implementation
    └── ...          # hash/, id/, swagger/, etc.
```

## Key Principles

- Services use singleton pattern — `private constructor` + `static getInstance()`.
- Services instantiated in `server.ts`, passed into `App.create()` via interfaces.
- `core/` has ApiError subclasses (NotFoundError, ConflictError, etc.) — use cases throw these.
- Enums do NOT live here — all enums live in `src/domain/enums/`.

## Detailed Rules

Loaded via `fileMatch` when editing files in these folders:
- `.kiro/steering/shared/services-rules.md`
- `.kiro/steering/shared/core-rules.md`
- `.kiro/steering/shared/config-rules.md`
- `.kiro/steering/shared/middlewares-rules.md`
- `.kiro/steering/shared/types-rules.md`
