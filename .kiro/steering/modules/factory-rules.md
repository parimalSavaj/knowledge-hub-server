---
description: Rules for module factory files (composition root that wires dependencies)
inclusion: fileMatch
fileMatchPattern: "src/modules/*/*.factory.ts"
---

# Factory Rules

## Location

- Every feature module has exactly one factory file at its root: `src/modules/<name>/<name>.factory.ts`.
- The factory is the **composition root** — the only file in the module that imports concrete classes from infrastructure.

## Structure

```ts
import { IDatabaseService } from '../../shared/services/interfaces/database.service.interface';
import { ILoggerService } from '../../shared/services/interfaces/logger.service.interface';
import { UsersRepository } from '../../infrastructure/repositories/users/users.repository';
import { RegisterUseCase } from './application/register.use-case';
import { LoginUseCase } from './application/login.use-case';
import { AuthController } from './presentation/auth.controller';

export class AuthFactory {
  static create(db: IDatabaseService, logger: ILoggerService): AuthController {
    const usersRepo = new UsersRepository(db);
    const registerUseCase = new RegisterUseCase(usersRepo);
    const loginUseCase = new LoginUseCase(usersRepo);
    return new AuthController(registerUseCase, loginUseCase);
  }
}
```

## Rules

- Class name: `<PascalName>Factory` (e.g., `AuthFactory`, `UsersFactory`, `DocumentsFactory`).
- Has a single static `create()` method — receives shared services, returns the controller.
- The **only file** in the entire module allowed to import concrete classes (repositories, external services).
- Wiring order: create repo instances → create use case instances (inject repos + services) → create controller (inject use cases) → return controller.
- Never imported by use cases, repositories, or external services — only by the routes file.
- Never contains business logic — only dependency wiring.
- Parameters are typed by interfaces (`IDatabaseService`, `ILoggerService`) — never concrete service classes.
- Return type is always the controller class for that module.
- One factory per module — no splitting, no multiple factory methods (one `create()` only).

## Import Rules

```
<name>.factory.ts imports:
  → ./presentation/<name>.controller          (to create and return)
  → ./application/<action>.use-case           (to instantiate use cases)
  → infrastructure/repositories/<entity>/     (CONCRETE classes — only place allowed)
  → infrastructure/external-services/<svc>/   (CONCRETE classes — only place allowed)
  → shared/services/interfaces/               (for parameter typing: IDatabaseService, ILoggerService, IJwtService)
```

## Why the Factory Exists

- Keeps dependency injection explicit and testable — no hidden `new` calls inside use cases or controllers.
- Isolates infrastructure knowledge — use cases and controllers never know which concrete repository or service they use.
- Single place to look when debugging "what is wired to what" in a module.

