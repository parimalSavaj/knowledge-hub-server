---
description: Rules for infrastructure repositories (database access, raw SQL, co-located interface/types/implementation)
inclusion: fileMatch
fileMatchPattern: "src/infrastructure/repositories/**"
---

# Repository Rules

## Location

- All repositories live in `src/infrastructure/repositories/` — one folder per entity/table.
- Folder naming: `<entity-name>/` (kebab-case, e.g., `users/`, `organizations/`, `org-members/`).

## Folder Structure (per repository)

Each repository folder contains exactly three files:

```
src/infrastructure/repositories/<name>/
├── <name>.repository.interface.ts    # Contract (what use cases depend on)
├── <name>.types.ts                   # Raw DB row type
└── <name>.repository.ts              # Implementation (raw SQL)
```

## Incremental Development Rule

- Never pre-create repository methods speculatively. Only add a method when a use case actually needs it.
- Start with an empty interface and empty implementation (just the class shell with `TABLE` and `constructor`).
- When a use case requires data access, add the method to the interface first, then implement it in the repository.
- This keeps the codebase lean — no dead code, no unused methods, no guessing what might be needed later.

## Row Types — `<name>.types.ts`

Raw DB row types represent exactly what PostgreSQL returns — snake_case column names, nullable fields matching the schema.

```ts
export type <Entity>Row = {
  id: string;
  <db_column>: <type>;
  <db_column>: <type> | null;
  // ... all columns matching table schema exactly
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};
```

Rules:
- Use `type` keyword — not `interface`.
- Property names match DB column names exactly (snake_case).
- Nullable columns use `| null` — never `?` optional.
- One row type per file — named `<Entity>Row` (e.g., `UserRow`, `OrganizationRow`).
- No domain logic, no methods — just a plain type alias.

## Interface — `<name>.repository.interface.ts`

Defines the contract that use cases depend on. Use cases never import the concrete repository.

```ts
import { PoolClient } from 'pg';
import { <Name>Entity } from '../../../domain/entities/<name>.entity';

export interface I<PascalName>Repository {
  findById(id: string, client?: PoolClient): Promise<<Name>Entity | null>;
  findBy<Field>(<field>: <type>, client?: PoolClient): Promise<<Name>Entity | null>;
  create(entity: <Name>Entity, client?: PoolClient): Promise<void>;
}
```

Rules:
- Interface name: `I<PascalName>Repository` (e.g., `IUsersRepository`, `IOrganizationsRepository`).
- Read methods return domain entities — never raw row types. (Exception: tables with no entity like `refresh_tokens` return row types directly.)
- `create()` methods accept the **entity** and return `Promise<void>` — for tables that have a domain entity. The repo extracts the fields it needs from the entity's getters. For tables without an entity (like `refresh_tokens`, `org_members`), `create()` accepts a plain data object.
- IDs are always `string` (UUID) — generated application-side via `IIdService` before the insert.
- Method parameters are plain objects or primitives — never DTOs from `modules/`.
- Methods that participate in transactions accept an **optional** `PoolClient` parameter as the last argument. When provided, the method uses it instead of `this.db`. When omitted, the method uses `this.db` normally.
- Import only from `domain/entities/`, `domain/enums/`, `domain/value-objects/`, and `PoolClient` type from `pg`.

## Implementation — `<name>.repository.ts`

The concrete class with raw SQL queries. The repository is responsible for calling `Entity.fromRecord(row)` to map DB rows to entities.

```ts
import { PoolClient } from 'pg';
import { IDatabaseService } from '../../../shared/services/database/database.service.interface';
import { <Name>Entity } from '../../../domain/entities/<name>.entity';
import { I<PascalName>Repository } from './<name>.repository.interface';
import { <Entity>Row } from './<name>.types';

export class <PascalName>Repository implements I<PascalName>Repository {
  private readonly TABLE = '<table_name>';

  constructor(private readonly db: IDatabaseService) {}

  async findById(id: string, client?: PoolClient): Promise<<Name>Entity | null> {
    const sql = `SELECT * FROM ${this.TABLE} WHERE id = $1 AND deleted_at IS NULL`;
    const params = [id];

    const row = client
      ? (await client.query<<Entity>Row>(sql, params)).rows[0] ?? null
      : await this.db.selectOne<<Entity>Row>(sql, params);

    return row ? this.toEntity(row) : null;
  }

  async create(entity: <Name>Entity, client?: PoolClient): Promise<void> {
    const sql = `INSERT INTO ${this.TABLE} (<columns>) VALUES ($1, $2, ...)`;
    const params = [entity.<getter1>, entity.<getter2>, ...];

    if (client) {
      await client.query(sql, params);
    } else {
      await this.db.insert(sql, params);
    }
  }

  // --- Private mapper: DB row → Entity (via fromRecord) ---
  private toEntity(row: <Entity>Row): <Name>Entity {
    return <Name>Entity.fromRecord(row);
  }
}
```

Rules:
- Class name: `<PascalName>Repository` (e.g., `UsersRepository`, `OrganizationsRepository`).
- Must implement its co-located interface.
- Has `private readonly TABLE = '<table_name>'` — used in all SQL strings.
- Has `constructor(private readonly db: IDatabaseService)` — receives the database service.
- **Only `IDatabaseService` is injected** — no other shared services (`IHashService`, `IJwtService`, `ILoggerService`, etc.) are allowed. Business-logic services belong in use cases, not repositories.
- Methods accept an **optional `PoolClient`** as the last parameter for transaction support. When provided, the method uses `client.query()` instead of `this.db`. When omitted, uses `this.db` normally.
- All queries filter `WHERE deleted_at IS NULL` for soft-deleted tables — this is the repository's responsibility, never the use case's.
- Returns domain entities via a private `toEntity(row)` method that calls `Entity.fromRecord(row)` — never returns raw rows to the use case. (Exception: tables with no entity return row types directly.)
- Every repository with a domain entity must have a `private toEntity(row: <Row>): <Entity>` method — this is the single place for row-to-entity mapping.
- Uses parameterized queries (`$1`, `$2`, ...) — never string interpolation for values.
- No business logic — only data access and entity mapping. Data arrives already prepared (e.g., passwords are already hashed by the use case before reaching the repository).
- **Always persist timestamps from the entity** — `create()` methods must include `created_at` and `updated_at` from `entity.createdAt` and `entity.updatedAt`. The entity is the source of truth for timestamps, not the DB's `DEFAULT NOW()`. This ensures the in-memory entity and the stored row are always consistent.
- Never begins or commits a transaction — that's the use case's job. Repos only execute queries.
- **Only create what is needed** — only add repository methods when a use case actually requires them. Never speculatively add `findById`, `findAll`, `update`, `delete`, or any other methods that no current use case calls.

## Import Rules

```
<name>.repository.ts imports:
  → ./<name>.repository.interface     (co-located interface)
  → ./<name>.types                    (co-located row type)
  → domain/entities/                  (for Entity.fromRecord() call)
  → domain/enums/                     (for enum casting if needed)
  → shared/services/database/database.service.interface  (for IDatabaseService)

<name>.repository.interface.ts imports:
  → domain/entities/                (return types)
  → domain/enums/                   (parameter types if needed)
  → domain/value-objects/           (if methods return entities with value objects)
```

## When a Table Has No Entity

Some tables (like `refresh_tokens`) are infrastructure/security concerns — they get a repository but no domain entity. In this case:
- The interface returns the row type directly (not an entity).
- The implementation returns raw rows — no `fromRecord()` mapping.
- Use cases work with the row type from the co-located `types` file.

```ts
import { <Name>Row } from './<name>.types';

export interface I<PascalName>Repository {
  findByToken(token: string): Promise<<Name>Row | null>;
  create(data: { id: string; userId: string; token: string; expiresAt: Date }): Promise<void>;
  revoke(id: string): Promise<void>;
}
```
