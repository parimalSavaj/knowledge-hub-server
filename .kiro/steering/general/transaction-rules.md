# Transaction Rules

## Overview

When a use case performs multiple DB operations that must succeed or fail together, it must use a database transaction. The use case owns the transaction boundary — never the repository.

## Transaction Pattern

`IDatabaseService` exposes `getClient()` which returns a raw `PoolClient` for transaction control.

The use case acquires the client, begins the transaction, executes SQL directly via `client.query()`, and commits or rolls back:

```ts
// inside a use case
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

    await client.query(
      'UPDATE inventory SET quantity = quantity - 1 WHERE item_id = $1',
      [dto.itemId],
    );

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

## Repository Design

Repositories are clean and stateless — they never accept a `PoolClient` parameter. Every method uses `this.db.*` directly:

```ts
// in domain/interfaces/infrastructure/repositories/orders.repository.interface.ts
export interface IOrdersRepository {
  findById(id: number): Promise<OrderEntity | null>;
  create(data: { userId: number; itemId: number }): Promise<OrderEntity>;
}

// in infrastructure/repositories/orders.repository.ts
export class OrdersRepository implements IOrdersRepository {
  private readonly TABLE = 'orders';

  constructor(private readonly db: IDatabaseService) {}

  async findById(id: number): Promise<OrderEntity | null> {
    const row = await this.db.selectOne<OrderRow>(
      `SELECT * FROM ${this.TABLE} WHERE id = $1`,
      [id],
    );
    return row ? OrderEntity.fromRecord(row) : null;
  }
}
```

## When to Use Transactions

- Use a transaction when 2+ write operations must succeed or fail together.
- Single-operation use cases use `this.db.*` methods through the repository — no transaction needed.
- Read-only use cases never need transactions.

## Row Types in Transactional Queries

When writing SQL directly inside a transaction, type the result with the row type from `infrastructure/repositories/types/`:

```ts
import { UserRow } from '../../../infrastructure/repositories/types/users.types';

const result = await client.query<UserRow>(
  'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
  [dto.name, dto.email, dto.password],
);
const user = result.rows[0];
```

## Rules

- Transaction boundary always lives in the use case — never in the repository or controller.
- Repositories never accept a `PoolClient` parameter — they are always called through `IDatabaseService`.
- When a use case needs a transaction, it calls `this.db.getClient()` and writes SQL directly via `client.query()`.
- Always release the client in a `finally` block — never skip this.
- Always rollback in the `catch` block before re-throwing the error.
- Never begin a transaction inside a repository method.
- `IDatabaseService` is injected into the use case via the factory when transactions are needed.
- Use row types from `domain/types/infrastructure/repositories/` as the generic in `client.query<RowType>()`.
