# Pagination & Filtering Rules

## Overview

All list endpoints must support pagination. Filtering and sorting are optional per endpoint but must follow the same convention when used.

## Query Parameters

Every list endpoint accepts these standard query params:

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number (1-based) |
| `limit` | number | 20 | Items per page (max 100) |
| `sortBy` | string | `created_at` | Column to sort by |
| `sortOrder` | `asc` \| `desc` | `desc` | Sort direction |
| `search` | string | — | Optional keyword search |

## Request DTO

Every list use case has a request DTO that extends `PaginationRequestDto`:

```ts
// src/domain/types/pagination.types.ts
export interface PaginationRequestDto {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
```

Module-specific list DTOs extend this:

```ts
// modules/users/application/dtos/get-users.dto.ts
export interface GetUsersRequestDto extends PaginationRequestDto {
  role?: UserRole;   // module-specific filter
}
```

## Response DTO

Every list use case returns a `PaginatedResponseDto`:

```ts
// src/domain/types/pagination.types.ts
export interface PaginatedResponseDto<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

## Repository Pattern

Repository list methods always accept pagination params and return total count:

```ts
// domain/interfaces/users.repository.interface.ts
findAll(params: GetUsersRequestDto): Promise<{ rows: UserEntity[]; total: number }>;
```

```ts
// infrastructure/repositories/users.repository.ts
async findAll(params: GetUsersRequestDto): Promise<{ rows: UserEntity[]; total: number }> {
  const { page, limit, sortBy = 'created_at', sortOrder = 'desc', search } = params;
  const offset = (page - 1) * limit;

  const whereClause = search ? `WHERE name ILIKE $3 OR email ILIKE $3` : '';
  const searchParam = search ? [`%${search}%`] : [];

  const rows = await this.db.select<UserEntity>(
    `SELECT * FROM users ${whereClause}
     ORDER BY ${sortBy} ${sortOrder}
     LIMIT $1 OFFSET $2`,
    [limit, offset, ...searchParam]
  );

  const [{ count }] = await this.db.select<{ count: string }>(
    `SELECT COUNT(*) as count FROM users ${whereClause}`,
    searchParam
  );

  return { rows, total: parseInt(count, 10) };
}
```

## Use Case Pattern

```ts
async execute(dto: GetUsersRequestDto): Promise<PaginatedResponseDto<GetUsersResponseDto>> {
  const { rows, total } = await this.usersRepo.findAll(dto);
  return {
    data: rows.map(user => ({ id: user.id, name: user.name, email: user.email })),
    meta: {
      total,
      page: dto.page,
      limit: dto.limit,
      totalPages: Math.ceil(total / dto.limit),
    },
  };
}
```

## Validation

Every list endpoint validates pagination params:

```ts
// presentation/users.validation.ts
export const getUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
  }),
});
```

## Rules

- Every list endpoint must be paginated — no endpoint returns an unbounded array.
- Max `limit` is 100 — enforce in validation, never in the repository.
- `page` is always 1-based — offset is calculated in the repository as `(page - 1) * limit`.
- `PaginationRequestDto` and `PaginatedResponseDto` live in `src/domain/types/pagination.types.ts`.
- Never use `OFFSET` without `LIMIT` in SQL.
- Sort column must be validated against an allowlist in the validation schema to prevent SQL injection.
