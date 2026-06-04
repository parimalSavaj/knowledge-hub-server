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

## Import Rules

```
application/use-cases imports:
  → ./dtos/                                                              (request & response DTOs)
  → infrastructure/repositories/<entity>/<entity>.repository.interface   (never concrete class)
  → infrastructure/repositories/<entity>/<entity>.types                  (row types, only for transactions)
  → infrastructure/external-services/<service>/<service>.external-service.interface
  → shared/services/interfaces/                                          (for IJwtService, ILoggerService, etc.)
  → shared/services/types/                                               (for JwtPayload, etc.)
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
