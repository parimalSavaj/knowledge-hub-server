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

Example:
```
src/infrastructure/repositories/users/
├── users.repository.interface.ts
├── users.types.ts
└── users.repository.ts
```

## Incremental Development Rule

- Never pre-create repository methods speculatively. Only add a method when a use case actually needs it.
- Start with an empty interface and empty implementation (just the class shell with `TABLE` and `constructor`).
- When a use case requires data access, add the method to the interface first, then implement it in the repository.
- This keeps the codebase lean — no dead code, no unused methods, no guessing what might be needed later.

## Row Types — `<name>.types.ts`

Raw DB row types represent exactly what PostgreSQL returns — snake_case column names, nullable fields matching the schema.

```ts
export type UserRow = {
  id: number;
  name: string;
  email: string;
  password: string | null;
  avatar_url: string | null;
  auth_provider: string;
  provider_id: string | null;
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
import { UserEntity } from '../../../domain/entities/user.entity';

export interface IUsersRepository {
  findById(id: number): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: { name: string; email: string; password: string }): Promise<UserEntity>;
}
```

Rules:
- Interface name: `I<PascalName>Repository` (e.g., `IUsersRepository`, `IOrganizationsRepository`).
- Methods return domain entities — never raw row types. (Exception: tables with no entity like `refresh_tokens` return row types directly.)
- Method parameters are plain objects or primitives — never DTOs from `modules/`.
- No `PoolClient` parameter — transaction control belongs in use cases.
- Import only from `domain/entities/`, `domain/enums/`, `domain/value-objects/`.

## Implementation — `<name>.repository.ts`

The concrete class with raw SQL queries. The repository is responsible for mapping DB rows (snake_case) to entity props (camelCase) via `Entity.create(props)`.

```ts
import { IDatabaseService } from '../../../shared/services/database/database.service.interface';
import { UserEntity } from '../../../domain/entities/user.entity';
import { AuthProvider } from '../../../domain/enums/auth-provider.enum';
import { IUsersRepository } from './users.repository.interface';
import { UserRow } from './users.types';

export class UsersRepository implements IUsersRepository {
  private readonly TABLE = 'users';

  constructor(private readonly db: IDatabaseService) {}

  async findById(id: number): Promise<UserEntity | null> {
    const row = await this.db.selectOne<UserRow>(
      `SELECT * FROM ${this.TABLE} WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.db.selectOne<UserRow>(
      `SELECT * FROM ${this.TABLE} WHERE email = $1 AND deleted_at IS NULL`,
      [email],
    );
    return row ? this.toEntity(row) : null;
  }

  async create(data: { name: string; email: string; password: string }): Promise<UserEntity> {
    const row = await this.db.insert<UserRow>(
      `INSERT INTO ${this.TABLE} (name, email, password) VALUES ($1, $2, $3) RETURNING *`,
      [data.name, data.email, data.password],
    );
    return this.toEntity(row);
  }

  // --- Private mapper: DB row (snake_case) → Entity props (camelCase) ---
  private toEntity(row: UserRow): UserEntity {
    return UserEntity.create({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      avatarUrl: row.avatar_url,
      authProvider: row.auth_provider as AuthProvider,
      providerId: row.provider_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    });
  }
}
```

Rules:
- Class name: `<PascalName>Repository` (e.g., `UsersRepository`, `OrganizationsRepository`).
- Must implement its co-located interface.
- Has `private readonly TABLE = '<table_name>'` — used in all SQL strings.
- Has `constructor(private readonly db: IDatabaseService)` — receives the database service.
- **Only `IDatabaseService` is injected** — no other shared services (`IHashService`, `IJwtService`, `ILoggerService`, etc.) are allowed. Business-logic services belong in use cases, not repositories.
- All queries filter `WHERE deleted_at IS NULL` for soft-deleted tables — this is the repository's responsibility, never the use case's.
- Returns domain entities via a private `toEntity(row)` method that maps row (snake_case) to `Entity.create(props)` (camelCase) — never returns raw rows to the use case. (Exception: tables with no entity return row types directly.)
- Every repository with a domain entity must have a `private toEntity(row: <Row>): <Entity>` method — this is the single place for row-to-entity mapping.
- Uses parameterized queries (`$1`, `$2`, ...) — never string interpolation for values.
- No business logic — only data access and entity mapping. Data arrives already prepared (e.g., passwords are already hashed by the use case before reaching the repository).
- Never accepts a `PoolClient` parameter — transaction control belongs in use cases per transaction rules.

## Import Rules

```
<name>.repository.ts imports:
  → ./name.repository.interface     (co-located interface)
  → ./name.types                    (co-located row type)
  → domain/entities/                (for Entity.create() call)
  → domain/enums/                   (for enum casting in toEntity mapping)
  → shared/services/<name>/<name>.service.interface  (for IDatabaseService)

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
// refresh-tokens.repository.interface.ts
import { RefreshTokenRow } from './refresh-tokens.types';

export interface IRefreshTokensRepository {
  findByToken(token: string): Promise<RefreshTokenRow | null>;
  create(data: { userId: number; token: string; expiresAt: Date }): Promise<RefreshTokenRow>;
  revoke(id: number): Promise<void>;
}
```
