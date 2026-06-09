import { PoolClient } from 'pg';
import { IDatabaseService } from '../../../shared/services/database/database.service.interface';
import { UserEntity } from '../../../domain/entities/user.entity';
import { IUsersRepository } from './users.repository.interface';
import { UserRow } from './users.types';

export class UsersRepository implements IUsersRepository {
  private readonly TABLE = 'users';

  constructor(private readonly db: IDatabaseService) {}

  async findByEmail(email: string, client?: PoolClient): Promise<UserEntity | null> {
    const sql = `SELECT * FROM ${this.TABLE} WHERE email = $1 AND deleted_at IS NULL`;
    const params = [email];

    const row = client
      ? (await client.query<UserRow>(sql, params)).rows[0] ?? null
      : await this.db.selectOne<UserRow>(sql, params);

    return row ? UserEntity.fromRecord(row) : null;
  }

  async create(entity: UserEntity, client?: PoolClient): Promise<void> {
    const sql = `
      INSERT INTO ${this.TABLE} (id, name, email, password, auth_provider, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const params = [
      entity.id,
      entity.name,
      entity.email,
      entity.password,
      entity.authProvider,
      entity.createdAt,
      entity.updatedAt,
    ];

    if (client) {
      await client.query(sql, params);
    } else {
      await this.db.insert(sql, params);
    }
  }
}
