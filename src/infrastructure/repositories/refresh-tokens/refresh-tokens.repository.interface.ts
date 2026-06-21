import { PoolClient } from "pg";
import { RefreshTokenRow } from "./refresh-tokens.types";

export interface IRefreshTokensRepository {
  findByToken(token: string, client?: PoolClient): Promise<RefreshTokenRow | null>;
  create(
    data: { id: string; userId: string; token: string; expiresAt: Date },
    client?: PoolClient,
  ): Promise<void>;
  revoke(id: string, client?: PoolClient): Promise<void>;
  hasActiveSession(userId: string, client?: PoolClient): Promise<boolean>;
}
