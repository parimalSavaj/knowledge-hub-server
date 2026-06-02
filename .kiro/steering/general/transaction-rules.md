# Transaction Rules

## Overview

When a use case performs multiple DB operations that must succeed or fail together, it must use a database transaction. The use case owns the transaction boundary — never the repository.

## Transaction Pattern

`IDatabaseService` exposes `getClient()` which returns a raw `PoolClient` for transaction control.

The use case acquires the client, begins the transaction, calls repository methods passing the client, and commits or rolls back:

```ts
// inside a use case
async execute(dto: CreateOrderRequestDto): Promise<CreateOrderResponseDto> {
  const client = await this.db.getClient();
  try {
    await client.query('BEGIN');

    const user = await this.usersRepo.findById(dto.userId, client);
    if (!user) throw new NotFoundError('User not found');

    const order = await this.ordersRepo.create(dto, client);
    await this.inventoryRepo.decrement(dto.itemId, client);

    await client.query('COMMIT');
    return { orderId: order.id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

## Repository Methods with Transaction Support

Repository methods that participate in transactions accept an optional `client` parameter:

```ts
// in domain/interfaces/orders.repository.interface.ts
export interface IOrdersRepository {
  create(dto: CreateOrderRequestDto, client?: PoolClient): Promise<OrderEntity>;
}

// in infrastructure/repositories/orders.repository.ts
async create(dto: CreateOrderRequestDto, client?: PoolClient): Promise<OrderEntity> {
  const runner = client ?? this.db;  // use client if provided, else pool
  return runner.query<OrderEntity>(
    'INSERT INTO orders (...) VALUES (...) RETURNING *',
    [...]
  ).then(r => r.rows[0]);
}
```

## Rules

- Transaction boundary always lives in the use case — never in the repository or controller.
- Repositories accept an optional `PoolClient` parameter for transactional calls.
- Always release the client in a `finally` block — never skip this.
- Always rollback in the `catch` block before re-throwing the error.
- Single-operation use cases do not need transactions — use the pool directly via `IDatabaseService`.
- Never begin a transaction inside a repository method.
- `IDatabaseService` is injected into the use case via the factory when transactions are needed.
