import type { QueryResult, ProcedureResult } from '../entities.js';

export interface IQueryRepository {
  executeQuery(sql: string, params: unknown[], maxRows: number, timeoutSeconds: number): Promise<QueryResult>;
  explainQuery(sql: string): Promise<QueryResult>;
  callProcedure(schema: string, procedure: string, args: unknown[]): Promise<ProcedureResult>;
}
