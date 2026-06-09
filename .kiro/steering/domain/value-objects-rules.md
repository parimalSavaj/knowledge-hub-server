---
description: Rules for domain value objects (immutable, no ID, private constructor, equals method)
inclusion: fileMatch
fileMatchPattern: "src/domain/value-objects/**"
---

# Value Object Rules

## Location

- All value objects live in `src/domain/value-objects/` — one file per value object.
- File naming: `<name>.value-object.ts` (e.g., `user-membership.value-object.ts`, `org-member.value-object.ts`).

## What Is a Value Object

A value object is a domain concept that:
1. **Has no unique ID** — it is defined entirely by its attributes.
2. **Is immutable** — once created, its properties never change. To "update" it, replace the whole object.
3. **Describes an entity** — it exists only in the context of a parent entity.

## Decision Matrix

Before creating a value object, confirm:
- **Identity Test:** Does this concept need a unique ID? → No = Value Object.
- **Mutation Test:** If any property changes, is it a different "thing"? → Yes = Value Object.
- **Lifecycle Test:** If the parent entity is deleted, should this disappear too? → Yes = Value Object.

## Structure

Every value object follows this pattern:

```ts
import { <EnumName> } from '../enums/<enum-name>.enum';

export class <Name> {
  private constructor(
    private readonly _<field1>: <type>,
    private readonly _<field2>: <type>,
    private readonly _<field3>: <EnumName>,
    // ... all properties as private readonly
  ) {}

  static create(props: {
    <field1>: <type>;
    <field2>: <type>;
    <field3>: <EnumName>;
  }): <Name> {
    return new <Name>(props.<field1>, props.<field2>, props.<field3>);
  }

  get <field1>(): <type> { return this._<field1>; }
  get <field2>(): <type> { return this._<field2>; }
  get <field3>(): <EnumName> { return this._<field3>; }

  equals(other: <Name>): boolean {
    return this._<field1> === other._<field1> && this._<field3> === other._<field3>;
  }
}
```

## Rules

- **Only create what is needed** — only add properties, getters, or methods when a use case actually requires them. Never speculatively add fields that no current code consumes. Add them when the use case that needs them is being built.
- **No IDs** — value objects never have an `id` property. They are identified by their combined attributes.
- **Private constructor** — created only via a static `create()` factory method.
- **Immutable** — all properties are `private readonly`. No setters, no mutation methods.
- **`equals()` method** — value objects define equality by comparing their attributes, not by reference. Compare the fields that define the identity of the value object.
- **No database awareness** — value objects never know about raw DB rows. The entity's `fromRecord()` or the repository constructs them.
- **Reusable across entities** — the same value object class can describe data inside different parent entities, but if the shape differs significantly by context, create separate value objects tailored to each parent.
- **No business logic that mutates state** — value objects can have computed getters or validation in `create()`, but they never change after construction.
- **One value object per file** — no multi-class files.
- **Import only from** — `domain/enums/`, other `domain/value-objects/` (if composing).

## Value Objects in This Project

| Value Object | Used Inside | Description |
|---|---|---|
| `OrgMembership` | `OrgMembersRepository` | Write-side: carries the data needed to persist a new org membership row (id, userId, organizationId, role, timestamps) |

The following value objects are planned but **not yet created** — they will be added when the use cases that need them are built:

| Value Object | Will Live Inside | Description |
|---|---|---|
| `UserMembership` | `UserEntity` | Read-side: represents which org a user belongs to and their role (orgId, orgName, orgSlug, role) |
| `OrgMember` | `OrganizationEntity` | Read-side: represents a member of an org (userId, userName, userEmail, role) |

## Why Two Value Objects Instead of One

The `org_members` table is a many-to-many relationship between users and organizations. Each side cares about different data:

- **UserEntity** asks: "Which orgs do I belong to?" → `UserMembership` carries org info.
- **OrganizationEntity** asks: "Who are my members?" → `OrgMember` carries user info.

One generic object would carry unnecessary data depending on the context. Two tailored value objects keep each entity focused and performant.

## Loading Strategy

Value objects are loaded **optionally** by the repository. Not every use case needs them:

- `findById(id)` → returns entity without value objects (fast).
- `findByIdWith<ValueObjects>(id)` → returns entity with value objects loaded (JOIN query).

The entity must handle the case where value objects are not loaded:

```ts
// Inside the entity
private _<valueObjects>: <ValueObject>[] | null = null;

get <valueObjects>(): <ValueObject>[] {
  if (this._<valueObjects> === null) {
    throw new Error('<ValueObjects> not loaded — use a repository method that loads them');
  }
  return this._<valueObjects>;
}

get has<ValueObjects>Loaded(): boolean {
  return this._<valueObjects> !== null;
}
```
