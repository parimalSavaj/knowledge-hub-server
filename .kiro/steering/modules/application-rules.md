---
description: Rules for module application layer (use cases and DTOs)
inclusion: fileMatch
fileMatchPattern: "src/modules/*/application/**"
---

# Application Layer Rules

## Location

- Lives inside each feature module at `src/modules/<name>/application/`.
- Contains two concerns: **use cases** (business logic) and **DTOs** (data shapes).

## Folder Structure

```
src/modules/<name>/application/
├── dtos/
│   ├── <action>-<entity>.dto.ts     # One file per API — request & response DTO classes
│   └── <action>-<entity>.dto.ts
├── <action>-<entity>.use-case.ts    # One file per API — single execute() method
└── <action>-<entity>.use-case.ts
```

## DTOs — `dtos/<action>-<entity>.dto.ts`

Each file contains **two classes**: a request DTO and a response DTO for one API endpoint.

```ts
// application/dtos/register.dto.ts

export class RegisterRequestDto {
  name: string;
  email: string;
  password: string;

  constructor(props: { name: string; email: string; password: string }) {
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
  }
}

export class RegisterResponseDto {
  id: number;
  name: string;
  email: string;
  createdAt: Date;

  constructor(props: { id: number; name: string; email: string; createdAt: Date }) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.createdAt = props.createdAt;
  }
}
```

DTO Rules:
- DTOs are **classes with a constructor** — not interfaces, not plain types.
- Constructor accepts a props object and assigns each property explicitly.
- One file per API — file naming: `<action>-<entity>.dto.ts` or `<action>.dto.ts`.
- Request DTO = what the use case accepts. Response DTO = what the use case returns.
- No validation logic in DTOs — validation lives in `presentation/validation`.
- No methods beyond the constructor — DTOs are pure data carriers.
- DTOs may import from `domain/enums/` if a property uses an enum type.
- DTOs never import from `infrastructure/`, `presentation/`, or `shared/`.

## Use Cases — `<action>-<entity>.use-case.ts`

Each file contains one class with a single `execute()` method.

```ts
// application/register.use-case.ts
import { IUsersRepository } from '../../../infrastructure/repositories/users/users.repository.interface';
import { ConflictError } from '../../../shared/core/api-error';
import { RegisterRequestDto, RegisterResponseDto } from './dtos/register.dto';

export class RegisterUseCase {
  constructor(private readonly usersRepo: IUsersRepository) {}

  async execute(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const user = await this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      password: dto.password, // hashed before this point or in repo
    });

    return new RegisterResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    });
  }
}
```

Use Case Rules:
- One use case per file — file naming: `<action>-<entity>.use-case.ts` or `<action>.use-case.ts`.
- Class name: `<PascalAction><PascalEntity>UseCase` (e.g., `RegisterUseCase`, `GetUserUseCase`).
- Single `execute(dto)` method — accepts request DTO, returns response DTO.
- Constructor receives **interfaces only** — repository interfaces, external service interfaces, shared service interfaces. Never concrete classes.
- Contains all business logic for one specific operation.
- Throws named errors from `shared/core/api-error.ts` (e.g., `NotFoundError`, `ConflictError`).
- Never imports from `presentation/` — no HTTP awareness.
- Never imports concrete repository or external service classes — only their interfaces.
- Never writes raw SQL — that's the repository's job.

## Shared Service Injection Rule

Shared services (`IHashService`, `IJwtService`, `ILoggerService`, etc.) are **always injected into use cases** — never into repositories or entities.

### Why

- Operations like password hashing, token signing, logging decisions, and notifications are **business decisions**. They represent application-level intent ("hash this password before storing"), not data access concerns.
- The **use case** is the place where these decisions are made — it orchestrates *what* happens and delegates *how* to the injected service.
- The **repository** is purely data access — it receives already-prepared data (e.g., an already-hashed password string) and stores it. It never needs to know how that data was prepared.
- The **entity** is a pure domain object — it has no dependencies on external libraries or services. It never calls hash, sign, or any async operation.

### Rules

- Shared services are injected into use cases via the factory's `create()` method — the factory passes the service interface to the use case constructor.
- Repositories receive **only** `IDatabaseService` as a constructor dependency — no other shared services (no `IHashService`, no `IJwtService`, no `ILoggerService`).
- Entities receive **zero** injected services — they are pure, self-contained domain objects with no outward dependencies.
- If a use case needs to hash a password, it calls `this.hashService.hash(plain)` and then passes the hashed result to the repository.
- If a use case needs to sign a token, it calls `this.jwtService.signAccessToken(payload)` — the repository never knows tokens exist.
- Third-party library calls (bcrypt, jsonwebtoken, etc.) are **always wrapped behind a shared service interface** — never called directly inside use cases, repositories, or entities.

### Correct Flow Example (Password Hashing)

```
Controller → passes raw password via DTO
  → Use Case → calls hashService.hash(dto.password), passes hashed value to repo
    → Repository → stores the hashed string it received (doesn't know or care it's hashed)
```

### Anti-Patterns (Never Do This)

| ❌ Wrong | Why |
|---|---|
| bcrypt inside repository | Repo is data access only — no business logic |
| bcrypt inside entity | Breaks domain purity, adds async to sync layer |
| bcrypt called directly in use case (without interface) | Tight coupling, untestable, not swappable |
| `IHashService` injected into repository | Repo should only receive `IDatabaseService` |

## Import Rules

```
application/use-cases imports:
  → ./dtos/                                                              (request & response DTOs)
  → infrastructure/repositories/<entity>/<entity>.repository.interface   (never concrete class)
  → infrastructure/repositories/<entity>/<entity>.types                  (row types, only for transactions)
  → infrastructure/external-services/<service>/<service>.external-service.interface
  → shared/services/<name>/<name>.service.interface  (for IJwtService, ILoggerService, etc.)
  → shared/services/<name>/<name>.types              (for JwtPayload, etc.)
  → shared/core/api-error                                                (for named error classes)
  → domain/entities/                                                     (for entity types)
  → domain/enums/                                                        (for enum values)

application/dtos imports:
  → domain/enums/    (only if a DTO property uses an enum type)
  → nothing else
```

## Checklist — Adding a New API to a Module

1. Create `application/dtos/<action>.dto.ts` — define request and response DTO classes.
2. Create `application/<action>.use-case.ts` — implement the business logic.
3. Add any needed repository methods to the interface first, then implement.
4. Wire the use case in the factory.
5. Add controller method, validation schema, and route registration.


## Transactions in Use Cases

When a use case performs multiple DB operations that must succeed or fail together, it owns the transaction boundary — never the repository.

### Pattern

`IDatabaseService` exposes `getClient()` which returns a raw `PoolClient` for transaction control. The use case acquires the client, begins the transaction, executes SQL directly via `client.query()`, and commits or rolls back:

```ts
async execute(dto: CreateOrderRequestDto): Promise<CreateOrderResponseDto> {
  const client = await this.db.getClient();
  try {
    await client.query('BEGIN');

    const userResult = await client.query<UserRow>(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [dto.userId],
    );
    const user = userResult.rows[0];
    if (!user) throw new NotFoundError('User not found');

    const orderResult = await client.query<OrderRow>(
      'INSERT INTO orders (user_id, item_id) VALUES ($1, $2) RETURNING *',
      [dto.userId, dto.itemId],
    );
    const order = orderResult.rows[0];

    await client.query('COMMIT');
    return new CreateOrderResponseDto({ orderId: order.id });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Transaction Rules

- Transaction boundary always lives in the use case — never in the repository or controller.
- When a use case needs a transaction, it calls `this.db.getClient()` and writes SQL directly via `client.query()`.
- `IDatabaseService` is injected into the use case via the factory when transactions are needed.
- Always release the client in a `finally` block — never skip this.
- Always rollback in the `catch` block before re-throwing the error.
- Never begin a transaction inside a repository method.
- Use row types from `infrastructure/repositories/<entity>/<entity>.types` as the generic in `client.query<RowType>()`.

### When to Use Transactions

- Use a transaction when 2+ write operations must succeed or fail together.
- Single-operation use cases call the repository directly — no transaction needed.
- Read-only use cases never need transactions.
