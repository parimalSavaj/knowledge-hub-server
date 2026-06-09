---
description: Rules for domain entities (private constructor, create factory, getters, business methods)
inclusion: fileMatch
fileMatchPattern: "src/domain/entities/**"
---

# Entity Rules

## Location

- All entities live in `src/domain/entities/` — one file per entity.
- File naming: `<name>.entity.ts` (e.g., `user.entity.ts`, `organization.entity.ts`).

## What Is an Entity

An entity is a domain concept with:
1. **A unique ID** — tracked over time.
2. **Identity-based equality** — two entities with the same ID are the same "thing", even if all other properties differ.
3. **An independent lifecycle** — it is not automatically destroyed when another object is deleted.

## Decision Matrix

Before creating an entity, confirm all three:
- **Identity Test:** Does this concept need a unique ID to be tracked over time? → Yes = Entity.
- **Mutation Test:** If every property changes, is it still the same "thing"? → Yes = Entity.
- **Lifecycle Test:** If the parent is deleted, should this be deleted automatically? → No = Entity (standalone).

If the answer to the Lifecycle Test is "Yes" → it's likely a Value Object or Child Entity, not a standalone entity.

## Structure

Every entity follows this pattern:

```ts
import { <EnumName> } from '../enums/<enum-name>.enum';

export class <Name>Entity {
  private constructor(
    private readonly _id: string,
    private readonly _<field1>: <type>,
    private readonly _<field2>: <type>,
    // ... all DB columns as private readonly fields
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
    private readonly _deletedAt: Date | null,
  ) {}

  // --- Factory: create new entity (use case calls this) ---
  static create(props: {
    id: string;
    <field1>: <type>;
    <field2>: <type>;
    // only business-required fields — no timestamps, no deletedAt
  }): <Name>Entity {
    const now = new Date();
    return new <Name>Entity(
      props.id,
      props.<field1>,
      props.<field2>,
      // ...
      now,   // createdAt
      now,   // updatedAt
      null,  // deletedAt
    );
  }

  // --- Factory: reconstruct from DB row (repository calls this) ---
  static fromRecord(row: {
    id: string;
    <db_column_1>: <type>;
    <db_column_2>: <type>;
    // all DB columns — snake_case, matching the table exactly
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
  }): <Name>Entity {
    return new <Name>Entity(
      row.id,
      row.<db_column_1>,
      row.<db_column_2> as <EnumName>,  // cast string columns to enums where needed
      // ...
      row.created_at,
      row.updated_at,
      row.deleted_at,
    );
  }

  // --- Getters ---
  get id(): string { return this._id; }
  get <field1>(): <type> { return this._<field1>; }
  get <field2>(): <type> { return this._<field2>; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get deletedAt(): Date | null { return this._deletedAt; }

  // --- Business Methods ---
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }
}
```

## Rules

- **Only create what is needed** — only add factories, getters, business methods, value object properties, or any other code when a use case actually requires it. Never speculatively add methods, getters, or fields that no current use case consumes. Add them when the use case that needs them is being built.
- **Private constructor** — entities are only created via `create()` or `fromRecord()`. No `new Entity()` outside the class.
- **Two factories:**
  - `static create(props)` — used by use cases to build a **new** entity before passing to the repo. Accepts only business-required fields (no timestamps, no deletedAt). Sets `createdAt`/`updatedAt` to `new Date()` and `deletedAt` to `null` internally.
  - `static fromRecord(row)` — used by repositories to reconstruct an entity from a DB row. The `row` parameter type is defined **inline** (not imported from infrastructure). It matches the DB column shape (snake_case, nullable) so the repository can pass the raw row directly. TypeScript's structural typing ensures the repository's `<Entity>Row` matches the inline shape without an explicit import.
- **Domain stays pure** — entities import **only** from `domain/enums/` and `domain/value-objects/`. Never from `infrastructure/`, `shared/`, or `modules/`. This is non-negotiable.
- **`fromRecord` uses inline type** — the row shape is declared directly in the method signature. No imported row types from infrastructure. Cast string columns to their enum type using `as <EnumName>` where needed.
- **Readonly getters** — all properties accessed via getters. External code never sets entity state directly.
- **Business methods** — entity enforces its own invariants. Use cases call entity methods like `entity.activate()` or `entity.changeRole()`, never `entity.status = 'active'`.
- **No HTTP awareness** — entities never know about requests, responses, status codes, or Express.
- **No repository calls** — entities never call the database. That's the use case's job.
- **Value objects as optional properties** — entities may hold value objects (e.g., `UserEntity` holds `UserMembership[]`). These are loaded optionally by the repository based on the use case's needs.
- **One entity per file** — no multi-entity files.
- **Import only from** — `domain/enums/`, `domain/value-objects/`. Never from `infrastructure/` or any outer layer.

## Entities in This Project

| Entity | Table | Description |
|---|---|---|
| `UserEntity` | `users` | Application user with auth provider support |
| `OrganizationEntity` | `organizations` | Workspace/team that users belong to |

## What is NOT an Entity

- `org_members` table → This is a relationship. It becomes value objects (`UserMembership` inside UserEntity, `OrgMember` inside OrganizationEntity).
- `refresh_tokens` table → This is a security/infrastructure concern. It gets a repository but no domain entity. Use cases interact with it via the repository interface directly using row types.
