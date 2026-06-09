import { PoolClient } from 'pg';
import { IDatabaseService } from '../../../shared/services/database/database.service.interface';
import { IRefreshTokensRepository } from './refresh-tokens.repository.interface';

export class RefreshTokensRepository implements IRefreshTokensRepository {
  private readonly TABLE = 'refresh_tokens';

  constructor(private readonly db: IDatabaseService) {}

  async create(data: { id: string; userId: string; token: string; expiresAt: Date }, client?: PoolClient): Promise<void> {
    const sql = `INSERT INTO ${this.TABLE} (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)`;
    const params = [data.id, data.userId, data.token, data.expiresAt];

    if (client) {
      await client.query(sql, params);
    } else {
      await this.db.insert(sql, params);
    }
  }
}
