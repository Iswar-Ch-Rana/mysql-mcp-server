import type { IQueryRepository, ExplainFormat } from '../../domain/interfaces/query.repository.js';
import type { ISqlValidator } from '../../domain/interfaces/sql-validator.js';
import type { IAuditLogger } from '../../domain/interfaces/logger.js';
import type {
  QueryResult,
  ProcedureResult,
  ProfileResult,
  TopQueryRow,
  ProcessRow,
  UnusedIndexRow,
} from '../../domain/entities.js';
import { SqlValidationError } from '../../domain/errors.js';

export class QueryService {
  constructor(
    private readonly queryRepo: IQueryRepository,
    private readonly sqlValidator: ISqlValidator,
    private readonly auditLogger: IAuditLogger,
    private readonly maxRows: number,
    private readonly timeoutSeconds: number,
  ) { }

  async runQuery(query: string, schema?: string, maxRows?: number): Promise<QueryResult> {
    const validation = this.sqlValidator.validate(query);
    if (!validation.isValid) {
      throw new SqlValidationError(validation.reason ?? 'SQL validation failed');
    }

    const effectiveMaxRows = maxRows ?? this.maxRows;
    const start = Date.now();

    try {
      const result = await this.queryRepo.executeQuery(query, [], effectiveMaxRows, this.timeoutSeconds);
      const durationMs = Date.now() - start;

      this.auditLogger.logQuery({
        query,
        durationMs,
        rowCount: result.rowCount,
        success: true,
        timestamp: new Date().toISOString(),
        schema: schema ?? '',
      });

      return result;
    } catch (err) {
      const durationMs = Date.now() - start;
      this.auditLogger.logQuery({
        query,
        durationMs,
        rowCount: 0,
        success: false,
        timestamp: new Date().toISOString(),
        schema: schema ?? '',
      });
      throw err;
    }
  }

  async explainQuery(query: string, format: ExplainFormat = 'default'): Promise<QueryResult> {
    const validation = this.sqlValidator.validate(query);
    if (!validation.isValid) {
      throw new SqlValidationError(validation.reason ?? 'SQL validation failed');
    }
    return this.queryRepo.explainQuery(query, format);
  }

  async callProcedure(schema: string, procedure: string, args: unknown[]): Promise<ProcedureResult> {
    const callSql = `CALL \`${schema}\`.\`${procedure}\`(${args.map(() => '?').join(', ')})`;
    const start = Date.now();
    try {
      const result = await this.queryRepo.callProcedure(schema, procedure, args);
      const durationMs = Date.now() - start;
      this.auditLogger.logQuery({
        query: callSql,
        durationMs,
        rowCount: result.resultSets.reduce((sum, rs) => sum + rs.rowCount, 0),
        success: true,
        timestamp: new Date().toISOString(),
        schema,
      });
      return result;
    } catch (err) {
      const durationMs = Date.now() - start;
      this.auditLogger.logQuery({
        query: callSql,
        durationMs,
        rowCount: 0,
        success: false,
        timestamp: new Date().toISOString(),
        schema,
      });
      throw err;
    }
  }

  async profileQuery(query: string, schema?: string): Promise<ProfileResult> {
    const validation = this.sqlValidator.validate(query);
    if (!validation.isValid) {
      throw new SqlValidationError(validation.reason ?? 'SQL validation failed');
    }
    const start = Date.now();
    try {
      const result = await this.queryRepo.profileQuery(query, [], this.timeoutSeconds);
      this.auditLogger.logQuery({
        query: `[profile] ${query}`,
        durationMs: Date.now() - start,
        rowCount: result.resultSets.reduce((s, rs) => s + rs.rowCount, 0),
        success: true,
        timestamp: new Date().toISOString(),
        schema: schema ?? '',
      });
      return result;
    } catch (err) {
      this.auditLogger.logQuery({
        query: `[profile] ${query}`,
        durationMs: Date.now() - start,
        rowCount: 0,
        success: false,
        timestamp: new Date().toISOString(),
        schema: schema ?? '',
      });
      throw err;
    }
  }

  async profileProcedure(schema: string, procedure: string, args: unknown[]): Promise<ProfileResult> {
    const start = Date.now();
    try {
      const result = await this.queryRepo.profileProcedure(schema, procedure, args, this.timeoutSeconds);
      this.auditLogger.logQuery({
        query: `[profile] CALL ${schema}.${procedure}(...)`,
        durationMs: Date.now() - start,
        rowCount: result.resultSets.reduce((s, rs) => s + rs.rowCount, 0),
        success: true,
        timestamp: new Date().toISOString(),
        schema,
      });
      return result;
    } catch (err) {
      this.auditLogger.logQuery({
        query: `[profile] CALL ${schema}.${procedure}(...)`,
        durationMs: Date.now() - start,
        rowCount: 0,
        success: false,
        timestamp: new Date().toISOString(),
        schema,
      });
      throw err;
    }
  }

  async topSlowQueries(limit: number, schema?: string): Promise<TopQueryRow[]> {
    return this.queryRepo.topSlowQueries(limit, schema);
  }

  async processList(includeSleep: boolean): Promise<ProcessRow[]> {
    return this.queryRepo.processList(includeSleep);
  }

  async unusedIndexes(schema?: string): Promise<UnusedIndexRow[]> {
    return this.queryRepo.unusedIndexes(schema);
  }
}
