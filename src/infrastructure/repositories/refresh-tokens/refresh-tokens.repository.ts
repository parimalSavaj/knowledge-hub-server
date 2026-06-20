import { PoolClient } from "pg";
import { IDatabaseService } from "../../../shared/services/database/database.service.interface";
import { IRefreshTokensRepository } from "./refresh-tokens.repository.interface";
import { RefreshTokenRow } from "./refresh-tokens.types";

export class RefreshTokensRepository implements IRefreshTokensRepository {
  private readonly TABLE = "refresh_tokens";

  constructor(private readonly db: IDatabaseService) {}

  async findByToken(token: string, client?: PoolClient): Promise<RefreshTokenRow | null> {
    const sql = `SELECT * FROM ${this.TABLE} WHERE token = $1`;
    const params = [token];

    const row = client
      ? ((await client.query<RefreshTokenRow>(sql, params)).rows[0] ?? null)
      : await this.db.selectOne<RefreshTokenRow>(sql, params);

    return row;
  }

  async create(
    data: { id: string; userId: string; token: string; expiresAt: Date },
    client?: PoolClient,
  ): Promise<void> {
    const sql = `INSERT INTO ${this.TABLE} (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)`;
    const params = [data.id, data.userId, data.token, data.expiresAt];

    if (client) {
      await client.query(sql, params);
    } else {
      await this.db.insert(sql, params);
    }
  }

  async revoke(id: string, client?: PoolClient): Promise<void> {
    const sql = `UPDATE ${this.TABLE} SET revoked = TRUE WHERE id = $1`;
    const params = [id];

    if (client) {
      await client.query(sql, params);
    } else {
      await this.db.update(sql, params);
    }
  }
}
