import { PoolClient } from 'pg';

export interface IRefreshTokensRepository {
  create(data: { id: string; userId: string; token: string; expiresAt: Date }, client?: PoolClient): Promise<void>;
}
