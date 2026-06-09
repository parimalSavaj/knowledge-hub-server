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
import { IDatabaseService } from '../../shared/services/database/database.service.interface';
import { ILoggerService } from '../../shared/services/logger/logger.service.interface';
import { <PascalEntity>Repository } from '../../infrastructure/repositories/<entity>/<entity>.repository';
import { <Action1>UseCase } from './application/<action1>.use-case';
import { <Action2>UseCase } from './application/<action2>.use-case';
import { <PascalName>Controller } from './presentation/<name>.controller';

export class <PascalName>Factory {
  static create(db: IDatabaseService, logger: ILoggerService): <PascalName>Controller {
    // 1. Create repo instances
    const <entityRepo> = new <PascalEntity>Repository(db);

    // 2. Create use case instances (inject repos + shared services)
    const <action1>UseCase = new <Action1>UseCase(<entityRepo>, logger);
    const <action2>UseCase = new <Action2>UseCase(<entityRepo>, logger);

    // 3. Create and return controller (inject use cases)
    return new <PascalName>Controller(<action1>UseCase, <action2>UseCase);
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
  → shared/services/<name>/<name>.service.interface  (for parameter typing: IDatabaseService, ILoggerService, IJwtService)
```

## Why the Factory Exists

- Keeps dependency injection explicit and testable — no hidden `new` calls inside use cases or controllers.
- Isolates infrastructure knowledge — use cases and controllers never know which concrete repository or service they use.
- Single place to look when debugging "what is wired to what" in a module.
