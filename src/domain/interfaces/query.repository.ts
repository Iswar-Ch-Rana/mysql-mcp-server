import type {
  QueryResult,
  ProcedureResult,
  ProfileResult,
  TopQueryRow,
  ProcessRow,
  UnusedIndexRow,
} from '../entities.js';

export type ExplainFormat = 'default' | 'analyze' | 'tree' | 'json';

export interface IQueryRepository {
  executeQuery(sql: string, params: unknown[], maxRows: number, timeoutSeconds: number): Promise<QueryResult>;
  explainQuery(sql: string, format?: ExplainFormat): Promise<QueryResult>;
  callProcedure(schema: string, procedure: string, args: unknown[]): Promise<ProcedureResult>;
  profileQuery(sql: string, params: unknown[], timeoutSeconds: number): Promise<ProfileResult>;
  profileProcedure(schema: string, procedure: string, args: unknown[], timeoutSeconds: number): Promise<ProfileResult>;
  topSlowQueries(limit: number, schema?: string): Promise<TopQueryRow[]>;
  processList(includeSleep: boolean): Promise<ProcessRow[]>;
  unusedIndexes(schema?: string): Promise<UnusedIndexRow[]>;
}
