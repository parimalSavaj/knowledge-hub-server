---
description: Summary of the modules layer (application, presentation, factory) — feature modules with layered architecture
inclusion: auto
---

# Modules Layer Rules

## Overview

`src/modules/` contains all application features. Every API endpoint lives inside a module. Two types: system (flat, no business logic) and feature (layered).

## Feature Module Structure

```
src/modules/<name>/
├── <name>.factory.ts          # Composition root — wires deps, returns controller
├── application/
│   ├── dtos/
│   │   └── <action>.dto.ts   # Request + Response DTO classes (one file per API)
│   └── <action>.use-case.ts  # Business logic (one file per API, single execute())
└── presentation/
    ├── <name>.routes.ts       # Registers endpoints, applies validation
    ├── <name>.controller.ts   # Handles req/res, delegates to use cases
    └── <name>.validation.ts   # Zod schemas
```

## Key Principles

- One API = one DTO file + one use case file — always 1:1.
- DTOs are **classes with constructors** (not interfaces).
- Use cases receive **interfaces only** — never concrete classes.
- Factory is the **only file** that imports concrete infrastructure classes.
- Controller methods are arrow functions, wrap results in `ApiResponse`, errors go to `next(error)`.
- Layer calling: Routes → Factory → Controller → Use Case → Repository.

## Detailed Rules

Loaded via `fileMatch` when editing files in these folders:
- `.kiro/steering/modules/application-rules.md`
- `.kiro/steering/modules/presentation-rules.md`
- `.kiro/steering/modules/factory-rules.md`
