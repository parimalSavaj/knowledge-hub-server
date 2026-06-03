---
inclusion: manual
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
import { OrgRole } from '../enums/org-role.enum';

export class UserMembership {
  private constructor(
    private readonly _orgId: number,
    private readonly _orgName: string,
    private readonly _orgSlug: string,
    private readonly _role: OrgRole,
  ) {}

  static create(orgId: number, orgName: string, orgSlug: string, role: OrgRole): UserMembership {
    return new UserMembership(orgId, orgName, orgSlug, role);
  }

  get orgId(): number { return this._orgId; }
  get orgName(): string { return this._orgName; }
  get orgSlug(): string { return this._orgSlug; }
  get role(): OrgRole { return this._role; }

  equals(other: UserMembership): boolean {
    return this._orgId === other._orgId && this._role === other._role;
  }
}
```

## Rules

- **No IDs** — value objects never have an `id` property. They are identified by their combined attributes.
- **Private constructor** — created only via a static `create()` factory method.
- **Immutable** — all properties are `private readonly`. No setters, no mutation methods.
- **`equals()` method** — value objects define equality by comparing their attributes, not by reference.
- **No database awareness** — value objects never know about raw DB rows. The entity's `fromRecord()` or the repository constructs them.
- **Reusable across entities** — the same value object class can describe data inside different parent entities, but if the shape differs significantly by context, create separate value objects tailored to each parent.
- **No business logic that mutates state** — value objects can have computed getters or validation in `create()`, but they never change after construction.
- **One value object per file** — no multi-class files.
- **Import only from** — `domain/enums/`, other `domain/value-objects/` (if composing).

## Value Objects in This Project

| Value Object | Used Inside | Description |
|---|---|---|
| `UserMembership` | `UserEntity` | Represents which org a user belongs to and their role (orgId, orgName, orgSlug, role) |
| `OrgMember` | `OrganizationEntity` | Represents a member of an org (userId, userName, userEmail, role) |

## Why Two Value Objects Instead of One

The `org_members` table is a many-to-many relationship between users and organizations. Each side cares about different data:

- **UserEntity** asks: "Which orgs do I belong to?" → `UserMembership` carries org info.
- **OrganizationEntity** asks: "Who are my members?" → `OrgMember` carries user info.

One generic object would carry unnecessary data depending on the context. Two tailored value objects keep each entity focused and performant.

## Loading Strategy

Value objects are loaded **optionally** by the repository. Not every use case needs them:

- `findById(id)` → returns entity without value objects (fast).
- `findByIdWithMemberships(id)` → returns entity with value objects loaded (JOIN query).

The entity must handle the case where value objects are not loaded:

```ts
// Inside the entity
private _memberships: UserMembership[] | null = null;

get memberships(): UserMembership[] {
  if (this._memberships === null) {
    throw new Error('Memberships not loaded — use a repository method that loads them');
  }
  return this._memberships;
}

get hasMembershipsLoaded(): boolean {
  return this._memberships !== null;
}
```
