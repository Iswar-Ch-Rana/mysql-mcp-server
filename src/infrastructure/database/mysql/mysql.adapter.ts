import mysql from 'mysql2/promise';
import type { Pool, PoolConnection } from 'mysql2/promise';
import type { PoolConfig, SslConfig } from '../../../shared/config.js';
import type { ILogger } from '../../../domain/interfaces/logger.js';
import { buildConnectionOptions } from './mysql.utils.js';

export class MySqlAdapter {
  private pool: Pool | null = null;

  constructor(private readonly logger?: ILogger) {}

  async connect(dsn: string, poolConfig: PoolConfig, sslConfig?: SslConfig): Promise<void> {
    const options = buildConnectionOptions(dsn, poolConfig, sslConfig);
    this.pool = mysql.createPool(options);
    // Test connection with ping
    const connection = await this.pool.getConnection();
    try {
      await connection.ping();
    } finally {
      connection.release();
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async query<T>(sql: string, params?: unknown[], timeoutMs?: number): Promise<T[]> {
    if (!this.pool) {
      throw new Error('Not connected to database');
    }
    let connection: PoolConnection | null = null;
    const start = Date.now();
    try {
      connection = await this.pool.getConnection();
      if (timeoutMs) {
        await connection.execute(`SET SESSION MAX_EXECUTION_TIME = ${Math.floor(timeoutMs)}`);
      }
      this.logger?.debug('Executing SQL', {
        sql,
        params: params ?? [],
      });
      const [rows] = await connection.execute(sql, params as any[]);
      const durationMs = Date.now() - start;
      const rowCount = Array.isArray(rows) ? rows.length : 0;
      this.logger?.debug('SQL result', { durationMs, rowCount });
      return rows as T[];
    } catch (err) {
      this.logger?.debug('SQL error', { sql, durationMs: Date.now() - start, error: (err as Error).message });
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async ping(): Promise<number> {
    const start = Date.now();
    await this.query('SELECT 1');
    return Date.now() - start;
  }

  async callProcedure(sql: string, params?: unknown[]): Promise<Record<string, unknown>[][]> {
    if (!this.pool) {
      throw new Error('Not connected to database');
    }
    let connection: PoolConnection | null = null;
    const start = Date.now();
    try {
      connection = await this.pool.getConnection();
      this.logger?.debug('Calling procedure', { sql, params: params ?? [] });
      // Use query() (not execute()) to get multiple result sets from CALL
      const [results] = await (connection as any).query(sql, params ?? []);
      const durationMs = Date.now() - start;
      this.logger?.debug('Procedure result', { durationMs });

      if (!Array.isArray(results)) {
        return [];
      }
      // CALL returns [ResultSet1, ResultSet2, ..., OkPacket]
      // Filter out non-array entries (OkPacket / ResultSetHeader)
      const resultSets = (results as unknown[]).filter((r) => Array.isArray(r)) as Record<string, unknown>[][];
      return resultSets;
    } catch (err) {
      this.logger?.debug('Procedure error', { sql, durationMs: Date.now() - start, error: (err as Error).message });
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  isConnected(): boolean {
    return this.pool !== null;
  }
}
