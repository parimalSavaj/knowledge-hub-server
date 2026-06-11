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
│   ├── <action>.dto.ts              # One file per API — request & response DTO classes
│   └── <action>.dto.ts
├── <action>.use-case.ts             # One file per API — single execute() method
└── <action>.use-case.ts
```

## DTOs — `dtos/<action>.dto.ts`

Each file contains **two classes**: a request DTO and a response DTO for one API endpoint.

```ts
import { Request } from 'express';

export class <Action>RequestDto {
  <field1>: <type>;
  <field2>: <type>;

  private constructor(props: { <field1>: <type>; <field2>: <type> }) {
    this.<field1> = props.<field1>;
    this.<field2> = props.<field2>;
  }

  static fromRequest(req: Request): <Action>RequestDto {
    return new <Action>RequestDto({
      <field1>: req.body.<field1>,
      <field2>: req.body.<field2>,
      // For authenticated routes, extract from req.user:
      // userId: req.user.userId,
      // orgId: req.user.orgId,
    });
  }
}

export class <Action>ResponseDto {
  <field1>: <type>;
  <field2>: <type>;

  private constructor(props: { <field1>: <type>; <field2>: <type> }) {
    this.<field1> = props.<field1>;
    this.<field2> = props.<field2>;
  }

  static fromEntities(entity: { <sourceField1>: <type>; <sourceField2>: <type> }): <Action>ResponseDto {
    return new <Action>ResponseDto({
      <field1>: entity.<sourceField1>,
      <field2>: entity.<sourceField2>,
    });
  }
}
```

DTO Rules:
- DTOs are **classes with a constructor** — not interfaces, not plain types.
- **Request DTOs** have a `private constructor` and a `static fromRequest(req: Request)` factory — the DTO owns the extraction logic from the request object. The controller never manually picks fields from `req.body` or `req.user`.
- **Response DTOs** have a `private constructor` and a `static fromEntities(...)` factory — the DTO owns the mapping logic from domain entities. The use case never manually picks fields from entities to build the response.
- `fromRequest` extracts from `req.body`, `req.params`, `req.query`, and `req.user` as needed.
- `fromEntities` accepts one or more entity/value-object shapes and maps them to the response fields. The use case calls `<Action>ResponseDto.fromEntities(entity)` — it never calls `new <Action>ResponseDto(...)` directly.
- One file per API — file naming: `<action>.dto.ts` or `<action>-<entity>.dto.ts`.
- Request DTO = what the use case accepts. Response DTO = what the use case returns.
- No validation logic in DTOs — validation lives in `presentation/validation`.
- No methods beyond the constructor, `fromRequest`, and `fromEntities` — DTOs are pure data carriers.
- DTOs may import from `domain/enums/` if a property uses an enum type.
- DTOs never import from `infrastructure/`, `presentation/`, or `shared/` (except `Request` type from express for `fromRequest`).

## Use Cases — `<action>.use-case.ts`

Each file contains one class with a single `execute()` method.

```ts
import { I<PascalEntity>Repository } from '../../../infrastructure/repositories/<entity>/<entity>.repository.interface';
import { <ErrorName> } from '../../../shared/core/api-error';
import { <Action>RequestDto, <Action>ResponseDto } from './dtos/<action>.dto';

export class <Action>UseCase {
  constructor(
    private readonly <entityRepo>: I<PascalEntity>Repository,
    // ... other interfaces (IHashService, ILoggerService, etc.)
  ) {}

  async execute(dto: <Action>RequestDto): Promise<<Action>ResponseDto> {
    // 1. Business logic (validation, checks, entity creation)
    // 2. Repository calls
    // 3. Return response DTO
  }
}
```

Use Case Rules:
- One use case per file — file naming: `<action>.use-case.ts` or `<action>-<entity>.use-case.ts`.
- Class name: `<PascalAction>UseCase` (e.g., `RegisterUseCase`, `GetUserUseCase`).
- Single `execute(dto)` method — accepts request DTO, returns response DTO.
- Constructor receives **interfaces only** — repository interfaces, external service interfaces, shared service interfaces. Never concrete classes.
- Contains all business logic for one specific operation.
- Throws named errors from `shared/core/api-error.ts` (e.g., `NotFoundError`, `ConflictError`).
- Never imports from `presentation/` — no HTTP awareness.
- Never imports concrete repository or external service classes — only their interfaces.
- Never writes raw SQL — that's the repository's job.
- **Only create what is needed** — only add use cases, DTOs, and their fields when actually required by a feature being built. Never speculatively create use cases, DTO properties, or helper methods that no current code path requires.

## Logging in Use Cases

Every use case should include production-ready logging via `ILoggerService` (injected through the factory).

### What to Log

| When | Level | What |
|---|---|---|
| Use case starts | `info` | Operation name + identifying context (email, userId) |
| Business rule violation | `warn` | What failed + context (e.g., duplicate email) |
| Transaction committed | `info` | Success + created resource IDs |
| Transaction rolled back | `error` | Failure + the error + context |
| Sensitive operations complete | `debug` | Token generation, external calls (never log secrets) |

### Rules

- `ILoggerService` is injected into use cases via the factory — same as other shared services.
- Always include **contextual data** (userId, email, orgId) so logs are searchable and traceable.
- **Never log secrets** — no passwords, tokens, or hashed values in log messages.
- Use the appropriate level: `info` for normal flow, `warn` for expected failures, `error` for unexpected failures, `debug` for verbose details.
- Log **before throwing** an error — once thrown, the error handler logs it generically. Use-case-level logs add business context the error handler doesn't have.

## Shared Service Injection Rule

Shared services (`IHashService`, `IJwtService`, `ILoggerService`, etc.) are **always injected into use cases** — never into repositories or entities.

### Why

- Operations like password hashing, token signing, logging decisions, and notifications are **business decisions**. They represent application-level intent ("hash this password before storing"), not data access concerns.
- The **use case** is the place where these decisions are made — it orchestrates *what* happens and delegates *how* to the injected service.
- The **repository** is purely data access — it receives already-prepared data (e.g., an already-hashed password string) and stores it. It never needs to know how that data was prepared.
- The **entity** is a pure domain object — it has no dependencies on external libraries or services.

### Rules

- Shared services are injected into use cases via the factory's `create()` method.
- Repositories receive **only** `IDatabaseService` as a constructor dependency.
- Entities receive **zero** injected services — they are pure, self-contained domain objects.
- If a use case needs to hash a password, it calls `this.hashService.hash(plain)` and passes the hashed result to the repository.
- If a use case needs to sign a token, it calls `this.jwtService.signAccessToken(payload)` — the repository never knows tokens exist.
- Third-party library calls (bcrypt, jsonwebtoken, etc.) are **always wrapped behind a shared service interface** — never called directly.

### Correct Flow

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
  → infrastructure/external-services/<service>/<service>.external-service.interface
  → shared/services/<name>/<name>.service.interface                      (for IJwtService, ILoggerService, IDatabaseService, etc.)
  → shared/services/<name>/<name>.types                                  (for JwtPayload, etc.)
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

```ts
async execute(dto: <Action>RequestDto): Promise<<Action>ResponseDto> {
  // Build entities before the transaction
  const entityA = <EntityA>.create({ id: generatedId, ...props });
  const entityB = <EntityB>.create({ id: generatedId, ...props });

  const client = await this.db.getClient();
  try {
    await client.query('BEGIN');

    await this.<entityARepo>.create(entityA, client);
    await this.<entityBRepo>.create(entityB, client);
    await this.<relationRepo>.create({ id, ...data }, client);

    await client.query('COMMIT');
    this.logger.info('<Action> completed successfully', { entityAId: entityA.id });
  } catch (error) {
    await client.query('ROLLBACK');
    this.logger.error('<Action> transaction failed', error, { /* context */ });
    throw new InternalError('<User-friendly message> — please try again');
  } finally {
    client.release();
  }

  return <Action>ResponseDto.fromEntities(entityA);
}
```

### Transaction Error Handling

- Always **log the original error** with `this.logger.error(...)` before throwing — this ensures the real DB error (constraint violations, connection issues, etc.) is captured in server logs for debugging.
- Always **throw `InternalError` with a user-friendly message** — never re-throw the raw error. Raw DB errors may expose table names, column names, or internal details that should not reach the client.
- The combination of logging + wrapping gives you: **debuggability in logs** (the real error with full stack trace) + **safety in responses** (a generic message for the client).
- To debug a transaction failure: check your server logs for the `error`-level entry with the context (userId, email, etc.) — the original error object and its stack trace will be there.

### Transaction Rules

- Transaction boundary always lives in the use case — never in the repository or controller.
- The use case calls `this.db.getClient()` to acquire a client, then passes it to repository methods.
- Repository methods accept an **optional** `PoolClient` parameter. When provided, the repo uses it instead of `this.db`.
- `IDatabaseService` is injected into the use case via the factory when transactions are needed.
- Always release the client in a `finally` block — never skip this.
- Always rollback in the `catch` block. Log the original error with context, then throw `InternalError` with a user-friendly message — never re-throw raw DB errors to the client.
- Never begin or commit a transaction inside a repository method.
- Only `BEGIN`, `COMMIT`, and `ROLLBACK` are called directly via `client.query()` in the use case — all data operations go through repo methods.

### Repository Method Signature for Transactions

```ts
// Interface — tables with entities
create(entity: <Name>Entity, client?: PoolClient): Promise<void>;
findById(id: string, client?: PoolClient): Promise<<Name>Entity | null>;

// Interface — tables without entities (plain data object)
create(data: { id: string; <field>: <type>; ... }, client?: PoolClient): Promise<void>;
```

### When to Use Transactions

- Use a transaction when 2+ write operations must succeed or fail together.
- Single-operation use cases call the repository directly without a client — no transaction needed.
- Read-only use cases never need transactions.
