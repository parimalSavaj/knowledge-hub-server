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
import { IDatabaseService } from '../../../shared/services/interfaces/database.service.interface';
import { ILoggerService } from '../../../shared/services/interfaces/logger.service.interface';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { AuthFactory } from '../auth.factory';
import { registerSchema, loginSchema } from './auth.validation';

export class AuthRoutes {
  private readonly router: Router;
  private readonly controller;

  constructor(db: IDatabaseService, logger: ILoggerService) {
    this.router = Router();
    this.controller = AuthFactory.create(db, logger);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/register', validate(registerSchema), this.controller.register);
    this.router.post('/login', validate(loginSchema), this.controller.login);
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
import { RegisterUseCase } from '../application/register.use-case';
import { LoginUseCase } from '../application/login.use-case';
import { RegisterRequestDto } from '../application/dtos/register.dto';
import { LoginRequestDto } from '../application/dtos/login.dto';

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = new RegisterRequestDto({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      });
      const result = await this.registerUseCase.execute(dto);
      res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, result));
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = new LoginRequestDto({
        email: req.body.email,
        password: req.body.password,
      });
      const result = await this.loginUseCase.execute(dto);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result));
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
- Each method: creates request DTO from `req` → calls `useCase.execute(dto)` → wraps in `ApiResponse` → sends response.
- Errors go to `next(error)` — never caught and handled inline.
- Never throws errors directly — delegates all error creation to use cases.
- No business logic — only request extraction and response formatting.
- Never imports repositories, external services, or domain entities directly.

## Validation — `<name>.validation.ts`

Zod schemas for request validation. One schema per endpoint.

```ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
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
  → shared/services/interfaces/          (for constructor params typing)

presentation/controller imports:
  → ../application/use-cases             (use case classes)
  → ../application/dtos/                 (DTO classes)
  → shared/core/api-response             (ApiResponse)
  → shared/constants/                    (HTTP_STATUS)

presentation/validation imports:
  → domain/enums/                        (for enum values in z.enum())
  → nothing else
```

