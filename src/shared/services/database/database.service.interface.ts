import { PoolClient, QueryResultRow } from "pg";

export interface IDatabaseService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  select<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<T[]>;
  selectOne<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<T | null>;
  insert<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<T>;
  update(text: string, params?: unknown[]): Promise<number>;
  delete(text: string, params?: unknown[]): Promise<number>;
  getClient(): Promise<PoolClient>;
}
