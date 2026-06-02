# API Flow Rules

Every API endpoint in this project follows the same flow without exception.
When creating or updating any API, follow this exact sequence.

## Request Flow

```
HTTP Request
  └── routes (validate request)
        └── factory (wires dependencies → returns controller)
              └── controller.method()
                    └── RequestDTO (extract from req)
                          └── useCase.execute(dto)
                                └── repository (data access)
                                └── external services (if needed)
                                └── ResponseDTO (shape output)
                    └── ApiResponse(result) → HTTP Response
```

---

## Layer Responsibilities

### 1. Routes — `presentation/<name>.routes.ts`
- Registers all endpoints for the module.
- Calls the factory once in the constructor to get the controller.
- Applies validation middleware before the controller method.
- No business logic. No direct imports of use cases or repositories.

```ts
constructor(db: IDatabaseService, logger: ILoggerService) {
  this.controller = UsersFactory.create(db, logger);
  this.setupRoutes();
}

private setupRoutes() {
  this.router.post('/', validate(createUserSchema), this.controller.createUser);
  this.router.get('/:id', validate(getUserSchema), this.controller.getUser);
}
```

### 2. Validation — `presentation/<name>.validation.ts`
- Defines validation schemas using **Zod** for each endpoint.
- Only validates shape and types — no business rules here.
- Exported as named schema objects, consumed by the `validate` middleware in routes.

### 3. Factory — `<name>.factory.ts` (module root)
- The composition root for the module.
- Creates the repository, instantiates all use cases, creates the controller.
- Returns the controller instance — nothing else.
- Only called from the routes file.

```ts
export class UsersFactory {
  static create(db: IDatabaseService, logger: ILoggerService): UsersController {
    const repo = new UsersRepository(db);
    const createUserUseCase = new CreateUserUseCase(repo, logger);
    const getUserUseCase = new GetUserUseCase(repo);
    return new UsersController(createUserUseCase, getUserUseCase);
  }
}
```

### 4. Controller — `presentation/<name>.controller.ts`
- One controller class per module. All handler methods live here.
- Constructor receives only use case instances — no db, no logger directly.
- Each method: extracts data into a RequestDTO → calls useCase.execute(dto) → wraps result in ApiResponse.
- Passes errors to next() — never handles errors inline.

```ts
export class UsersController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private getUserUseCase: GetUserUseCase,
  ) {}

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateUserRequestDto = { name: req.body.name, email: req.body.email };
      const result = await this.createUserUseCase.execute(dto);
      res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, result));
    } catch (error) {
      next(error);
    }
  };
}
```

### 5. DTOs — `application/dtos/<use-case>.dto.ts`
- One file per use case. Contains both request and response DTO in the same file.
- RequestDTO — typed shape of what the use case accepts (extracted from req).
- ResponseDTO — typed shape of what the use case returns to the controller.
- Pure interfaces — no classes, no methods, no validation logic.

```ts
// create-user.dto.ts
export interface CreateUserRequestDto {
  name: string;
  email: string;
  password: string;
}

export interface CreateUserResponseDto {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}
```

### 6. Use Case — `application/<action>-<entity>.use-case.ts`
- One file per use case. One `execute()` method.
- Constructor receives repository interface and any external services needed.
- Contains all business logic for that specific operation.
- Accepts RequestDTO, returns ResponseDTO.
- Never imports from `presentation/` or `infrastructure/repositories/` directly.

```ts
export class CreateUserUseCase {
  constructor(private usersRepo: IUsersRepository) {}

  async execute(dto: CreateUserRequestDto): Promise<CreateUserResponseDto> {
    // business logic here
    const user = await this.usersRepo.create(dto);
    return { id: user.id, name: user.name, email: user.email, createdAt: user.created_at };
  }
}
```

### 7. Repository Interface — `domain/interfaces/<name>.repository.interface.ts`
- Defines the contract the use case depends on.
- Use cases import this interface — never the concrete repository.
- One interface per entity.

```ts
export interface IUsersRepository {
  findAll(): Promise<UserEntity[]>;
  findById(id: number): Promise<UserEntity | null>;
  create(dto: CreateUserRequestDto): Promise<UserEntity>;
}
```

### 8. Repository — `infrastructure/repositories/<name>.repository.ts`
- Implements the repository interface from `domain/interfaces/`.
- Contains raw SQL queries only — no business logic.
- Uses `IDatabaseService` methods (select, selectOne, insert, update, delete).

```ts
export class UsersRepository implements IUsersRepository {
  constructor(private db: IDatabaseService) {}

  async findById(id: number): Promise<UserEntity | null> {
    return this.db.selectOne<UserEntity>(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [id]
    );
  }
}
```

---

## Checklist — Adding a New API Endpoint

When adding a new endpoint to an existing or new module, follow this order:

1. **Entity** — add or update `domain/entities/<name>.entity.ts` if the DB shape is new.
2. **Types** — add any new enums or plain types to `domain/types/<name>.types.ts`.
3. **Repository interface** — add the new method signature to `domain/interfaces/<name>.repository.interface.ts`.
4. **Repository implementation** — implement the new method with raw SQL in `infrastructure/repositories/<name>.repository.ts`.
5. **DTO** — create `application/dtos/<action>-<entity>.dto.ts` with request and response interfaces.
6. **Use case** — create `application/<action>-<entity>.use-case.ts` with the `execute()` method.
7. **Controller** — add the new handler method to `presentation/<name>.controller.ts`.
8. **Validation** — add the validation schema to `presentation/<name>.validation.ts`.
9. **Factory** — wire the new use case in `<name>.factory.ts`.
10. **Routes** — register the new endpoint in `presentation/<name>.routes.ts`.
11. **Route constant** — add the new route prefix to `shared/constants/route.constants.ts` if it's a new module.
12. **app.ts** — register the new module routes in `initializeProtectedRoutes()` or `initializePublicRoutes()`.

---

## Rules

- Never skip layers — controller never calls repository directly, use case never calls controller.
- Never put business logic in routes, validation, or repository files.
- Never put SQL in use cases or controllers.
- One use case = one operation = one `execute()` method.
- All errors bubble up via `next(error)` — never swallow or handle inline in controllers.
- Always type DTOs explicitly — no `any`, no `unknown` unless genuinely uncertain.
