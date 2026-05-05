import mysql from 'mysql2/promise';
import type { Pool, PoolConnection } from 'mysql2/promise';
import type { PoolConfig, SslConfig } from '../../../shared/config.js';
import type { ILogger } from '../../../domain/interfaces/logger.js';
import type { ProfileResult, ProfileEntry, ProcedureResultSet } from '../../../domain/entities.js';
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

  /**
   * Run one or more statements with MySQL session profiling enabled, then
   * return per-statement timings via SHOW PROFILES. The connection is held
   * for the entire sequence so profiling state stays scoped.
   *
   * If `expectMultipleResultSets` is true, the inner statements are executed
   * via `query()` (which can carry multiple result sets, e.g. for CALL).
   */
  async profileStatements(
    statements: string[],
    params: unknown[],
    timeoutMs?: number,
    expectMultipleResultSets = false,
  ): Promise<ProfileResult> {
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
      // Enable session profiling. Both lines are hard-coded server-side; user
      // input never reaches a SET statement.
      await connection.query('SET SESSION profiling = 1');
      await connection.query('SET SESSION profiling_history_size = 100');

      const resultSets: ProcedureResultSet[] = [];
      for (const sql of statements) {
        if (expectMultipleResultSets) {
          // CALL statements may return multiple result sets, plus a trailing
          // OkPacket. Filter to just the data sets.
          const [results] = await (connection as any).query(sql, params);
          if (Array.isArray(results)) {
            for (const rs of results as unknown[]) {
              if (Array.isArray(rs)) {
                const rows = rs as Record<string, unknown>[];
                resultSets.push({
                  columns: rows.length > 0 ? Object.keys(rows[0]) : [],
                  rows,
                  rowCount: rows.length,
                });
              }
            }
          }
        } else {
          const [rows] = await connection.query(sql, params);
          const data = (rows as Record<string, unknown>[]) ?? [];
          resultSets.push({
            columns: data.length > 0 ? Object.keys(data[0]) : [],
            rows: data,
            rowCount: data.length,
          });
        }
      }

      // Pull the profile timings.
      const [profileRows] = await connection.query('SHOW PROFILES');
      const profile: ProfileEntry[] = ((profileRows as Record<string, unknown>[]) ?? []).map((r) => ({
        queryId: Number(r.Query_ID) || 0,
        durationSeconds: Number(r.Duration) || 0,
        query: String(r.Query ?? ''),
      }));

      // Hide the profiling-management statements themselves and find hottest.
      const userFacing = profile.filter((p) => !/^\s*set\s+session\s+profiling/i.test(p.query));
      let hottest: ProfileEntry | null = null;
      for (const p of userFacing) {
        if (!hottest || p.durationSeconds > hottest.durationSeconds) hottest = p;
      }

      // Reset profiling so we don't leak state to the next pool user.
      await connection.query('SET SESSION profiling = 0');

      return {
        resultSets,
        profile: userFacing,
        hottest,
        totalMs: Date.now() - start,
      };
    } catch (err) {
      this.logger?.debug('profileStatements error', {
        durationMs: Date.now() - start,
        error: (err as Error).message,
      });
      throw err;
    } finally {
      if (connection) connection.release();
    }
  }

  isConnected(): boolean {
    return this.pool !== null;
  }
}
