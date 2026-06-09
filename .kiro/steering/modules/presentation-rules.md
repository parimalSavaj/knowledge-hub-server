---
description: Rules for module presentation layer (routes, controller, validation)
inclusion: fileMatch
fileMatchPattern: "src/modules/*/presentation/**"
---

# Presentation Layer Rules

## Location

- Lives inside each feature module at `src/modules/<name>/presentation/`.
- Contains exactly three files per module: routes, controller, validation.

## Folder Structure

```
src/modules/<name>/presentation/
├── <name>.routes.ts          # Registers endpoints, applies validation + auth middleware
├── <name>.controller.ts      # Handles req/res, delegates to use cases
└── <name>.validation.ts      # Zod schemas for request validation
```

## Routes — `<name>.routes.ts`

Registers all endpoints for the module. Calls the factory once to get the controller.

```ts
import { Router } from 'express';
import { IDatabaseService } from '../../../shared/services/database/database.service.interface';
import { ILoggerService } from '../../../shared/services/logger/logger.service.interface';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { <PascalName>Factory } from '../<name>.factory';
import { <action1>Schema, <action2>Schema } from './<name>.validation';

export class <PascalName>Routes {
  private readonly router: Router;
  private readonly controller;

  constructor(db: IDatabaseService, logger: ILoggerService) {
    this.router = Router();
    this.controller = <PascalName>Factory.create(db, logger);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/<endpoint1>', validate(<action1>Schema), this.controller.<action1>);
    this.router.post('/<endpoint2>', validate(<action2>Schema), this.controller.<action2>);
  }

  getRouter(): Router {
    return this.router;
  }
}
```

Routes Rules:
- Class name: `<PascalName>Routes` (e.g., `AuthRoutes`, `UsersRoutes`).
- Constructor receives shared services (`IDatabaseService`, `ILoggerService`) needed by the factory.
- Calls factory **once** in the constructor — stores the controller.
- `setupRoutes()` is private — registers all endpoints with validation and auth middleware.
- Exports `getRouter()` method — returns the Express Router.
- No business logic — only endpoint registration and middleware application.
- Never imports use cases or repositories directly.

## Controller — `<name>.controller.ts`

Handles HTTP request/response. Extracts data into DTOs, calls use cases, returns responses.

```ts
import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../../../shared/constants/status-code.constants';
import { ApiResponse } from '../../../shared/core/api-response';
import { <Action1>UseCase } from '../application/<action1>.use-case';
import { <Action1>RequestDto } from '../application/dtos/<action1>.dto';

export class <PascalName>Controller {
  constructor(
    private readonly <action1>UseCase: <Action1>UseCase,
    // ... other use cases
  ) {}

  <action1> = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = <Action1>RequestDto.fromRequest(req);
      const result = await this.<action1>UseCase.execute(dto);
      res.status(HTTP_STATUS.<STATUS>).json(new ApiResponse(HTTP_STATUS.<STATUS>, result));
    } catch (error) {
      next(error);
    }
  };
}
```

Controller Rules:
- Class name: `<PascalName>Controller` (e.g., `AuthController`, `UsersController`).
- Constructor receives **only use case instances** — no db, no logger, no repos.
- Each method is an arrow function (preserves `this` context for Express routing).
- Each method: calls `RequestDto.fromRequest(req)` → calls `useCase.execute(dto)` → wraps in `ApiResponse` → sends response. The controller never manually extracts fields from `req.body` or `req.user` — that's the DTO's job.
- Errors go to `next(error)` — never caught and handled inline.
- Never throws errors directly — delegates all error creation to use cases.
- No business logic — only request delegation and response formatting.
- Never imports repositories, external services, or domain entities directly.
- **Only create what is needed** — only add controller methods and validation schemas when a use case and route actually require them. Never speculatively create endpoints or schemas that are not wired to a live route.

## Validation — `<name>.validation.ts`

Zod schemas for request validation. One schema per endpoint.

```ts
import { z } from 'zod';

export const <action1>Schema = z.object({
  body: z.object({
    <field1>: z.string().min(1).max(100),
    <field2>: z.string().email().max(255),
  }),
});

export const <action2>Schema = z.object({
  body: z.object({
    <field1>: z.string().min(1),
  }),
});
```

Validation Rules:
- One exported schema per endpoint — named `<action>Schema` or `<action><Entity>Schema`.
- Validates shape and types only — no business rules (e.g., "email must be unique" is a use case concern, not validation).
- Use `z.coerce.number()` for query/path params that come as strings.
- Use `z.enum([...])` with explicit string values — never `z.nativeEnum()`.
- May import from `domain/enums/` to get enum values for `z.enum()`.
- Never imports from `application/`, `infrastructure/`, or `shared/services/`.

## Import Rules

```
presentation/routes imports:
  → ../factory                           (to get controller)
  → ./validation                         (Zod schemas)
  → shared/middlewares/                   (auth, validate)
  → shared/services/<name>/<name>.service.interface  (for constructor params typing)

presentation/controller imports:
  → ../application/use-cases             (use case classes)
  → ../application/dtos/                 (DTO classes)
  → shared/core/api-response             (ApiResponse)
  → shared/constants/                    (HTTP_STATUS)

presentation/validation imports:
  → domain/enums/                        (for enum values in z.enum())
  → nothing else
```
