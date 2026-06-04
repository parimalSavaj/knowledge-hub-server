---
description: Rules for domain entities (private constructor, fromRecord factory, getters, business methods)
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

Every entity follows this exact pattern:

```ts
import { SomeRow } from '../../infrastructure/repositories/types/some.types';

export class SomeEntity {
  private constructor(
    private readonly _id: number,
    private readonly _name: string,
    private readonly _email: string,
    private _status: string,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
    private readonly _deletedAt: Date | null,
  ) {}

  // --- Factory ---
  static fromRecord(row: SomeRow): SomeEntity {
    return new SomeEntity(
      row.id,
      row.name,
      row.email,
      row.status,
      row.created_at,
      row.updated_at,
      row.deleted_at,
    );
  }

  // --- Getters ---
  get id(): number { return this._id; }
  get name(): string { return this._name; }
  get email(): string { return this._email; }
  get status(): string { return this._status; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get deletedAt(): Date | null { return this._deletedAt; }

  // --- Business Methods ---
  activate(): void {
    if (this._status === 'active') {
      throw new Error('Account is already active');
    }
    this._status = 'active';
  }

  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }
}
```

## Rules

- **Private constructor** — entities are only created via `fromRecord()`. No `new Entity()` outside the class.
- **`fromRecord()` factory** — accepts a raw DB row type (from `infrastructure/repositories/types/`) and maps it to the entity.
- **Readonly getters** — all properties accessed via getters. External code never sets entity state directly.
- **Business methods** — entity enforces its own invariants. Use cases call entity methods like `entity.activate()` or `entity.changeRole()`, never `entity.status = 'active'`.
- **No HTTP awareness** — entities never know about requests, responses, status codes, or Express.
- **No repository calls** — entities never call the database. That's the use case's job.
- **Value objects as optional properties** — entities may hold value objects (e.g., `UserEntity` holds `UserMembership[]`). These are loaded optionally by the repository based on the use case's needs.
- **One entity per file** — no multi-entity files.
- **Import only from** — `infrastructure/repositories/types/` (for row types), `domain/enums/`, `domain/value-objects/`.

## Entities in This Project

| Entity | Table | Description |
|---|---|---|
| `UserEntity` | `users` | Application user with auth provider support |
| `OrganizationEntity` | `organizations` | Workspace/team that users belong to |

## What is NOT an Entity

- `org_members` table → This is a relationship. It becomes value objects (`UserMembership` inside UserEntity, `OrgMember` inside OrganizationEntity).
- `refresh_tokens` table → This is a security/infrastructure concern. It gets a repository but no domain entity. Use cases interact with it via the repository interface directly using row types.
