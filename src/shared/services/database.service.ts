import { Pool, PoolClient, QueryResultRow } from "pg";
import { config } from "../config";
import { LoggerService } from "./logger.service";
import { IDatabaseService } from "./interfaces/database.service.interface";

export class DatabaseService implements IDatabaseService {
  private static instance: DatabaseService | null = null;
  private pool: Pool | null = null;
  private logger = LoggerService.getInstance();

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect(): Promise<void> {
    if (this.pool) {
      this.logger.warn("Database pool already exists, skipping connection");
      return;
    }

    this.pool = new Pool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    const client = await this.pool.connect();
    await client.query("SELECT 1");
    client.release();
    this.logger.info("Database connected successfully", {
      host: config.db.host,
      database: config.db.name,
    });
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.logger.info("Database disconnected");
    }
  }

  // Returns all matching rows
  async select<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<T[]> {
    this.ensureConnected();
    const result = await this.pool!.query<T>(text, params);
    return result.rows;
  }

  // Returns first matching row or null
  async selectOne<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<T | null> {
    this.ensureConnected();
    const result = await this.pool!.query<T>(text, params);
    return result.rows[0] ?? null;
  }

  // Returns the inserted row (use RETURNING * in your SQL)
  async insert<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<T> {
    this.ensureConnected();
    const result = await this.pool!.query<T>(text, params);
    return result.rows[0];
  }

  // Returns number of affected rows
  async update(text: string, params?: unknown[]): Promise<number> {
    this.ensureConnected();
    const result = await this.pool!.query(text, params);
    return result.rowCount ?? 0;
  }

  // Returns number of deleted rows
  async delete(text: string, params?: unknown[]): Promise<number> {
    this.ensureConnected();
    const result = await this.pool!.query(text, params);
    return result.rowCount ?? 0;
  }

  private ensureConnected(): void {
    if (!this.pool) {
      throw new Error("Database not connected. Call connect() first.");
    }
  }
}


