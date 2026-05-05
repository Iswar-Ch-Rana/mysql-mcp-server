export interface SchemaInfo {
  name: string;
  tableCount: number;
  viewCount: number;
  procedureCount: number;
  functionCount: number;
  sizeMb: number;
}

export interface DatabaseInfo {
  name: string;
}

export interface TableInfo {
  name: string;
  schema: string;
  engine: string;
  rowCount: number;
  sizeMb: number;
  comment: string;
  type: 'TABLE' | 'VIEW';
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  key: 'PRI' | 'UNI' | 'MUL' | '';
  defaultValue: string | null;
  extra: string;
  comment: string;
  collation: string | null;
}

export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
  type: string;
  table: string;
  nonUnique: boolean;
  cardinality: number;
}

export interface ViewInfo {
  name: string;
  definer: string;
  securityType: string;
  isUpdatable: boolean;
}

export interface TriggerInfo {
  name: string;
  event: string;
  table: string;
  timing: string;
  statement: string;
}

export interface RoutineInfo {
  name: string;
  type: 'PROCEDURE' | 'FUNCTION';
  definer: string;
  created: string;
  lastAltered: string;
  dtdIdentifier: string;
  parameterStyle: string;
}

export interface PartitionInfo {
  name: string;
  method: string;
  expression: string;
  description: string;
  rowCount: number;
  dataLength: number;
}

export interface ForeignKeyInfo {
  constraintName: string;
  tableName: string;
  columnName: string;
  referencedTableName: string;
  referencedColumnName: string;
}

export interface SizeInfo {
  name: string;
  dataMb: number;
  indexMb: number;
  totalMb: number;
  rowCount: number;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  durationMs: number;
  truncated: boolean;
}

export interface ServerInfo {
  version: string;
  uptime: number;
  isMariaDb: boolean;
  currentUser: string;
  currentDatabase: string;
}

export interface ConnectionInfo {
  name: string;
  host: string;
  active: boolean;
  activeSchema: string;
}

export interface StatusVariable {
  name: string;
  value: string;
}

export interface ConfigVariable {
  name: string;
  value: string;
}

export type ObjectType = 'table' | 'view' | 'procedure' | 'function';

export interface SearchResult {
  schema: string;
  objectName: string;
  objectType: ObjectType;
}

export interface ProcedureResultSet {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface ProcedureResult {
  procedureName: string;
  resultSets: ProcedureResultSet[];
  durationMs: number;
}

export interface AuditEntry {
  query: string;
  durationMs: number;
  rowCount: number;
  success: boolean;
  timestamp: string;
  schema: string;
}

export interface ProfileEntry {
  queryId: number;
  durationSeconds: number;
  query: string;
}

export interface ProfileResult {
  /** Result rows from the profiled query (first result set if it was a CALL) */
  resultSets: ProcedureResultSet[];
  /** Per-statement profile timings as reported by SHOW PROFILES */
  profile: ProfileEntry[];
  /** The slowest profile entry — convenient for the LLM */
  hottest: ProfileEntry | null;
  /** Total wall-clock time spent in MCP-side execution */
  totalMs: number;
}

export interface TopQueryRow {
  query: string;
  db: string | null;
  exec_count: number;
  total_ms: number;
  avg_ms: number;
  max_ms: number;
  rows_examined: number;
  rows_sent: number;
  no_index_used: number;
  FIRST_SEEN: string;
  LAST_SEEN: string;
}

export interface ProcessRow {
  id: number;
  user: string;
  host: string;
  db: string | null;
  command: string;
  seconds: number;
  state: string | null;
  info: string | null;
}

export interface UnusedIndexRow {
  schema: string;
  table: string;
  index: string;
}

export interface RedundantIndex {
  schema: string;
  table: string;
  redundantIndex: string;
  supersededBy: string;
  reason: string;
}

export interface IndexHealthReport {
  unused: UnusedIndexRow[];
  redundant: RedundantIndex[];
}

export interface ExplainBottleneck {
  operation: string;
  actualTimeMs: number | null;
  loops: number | null;
  perIterationUs: number | null;
}

export interface ExplainResult {
  format: 'default' | 'analyze' | 'tree' | 'json';
  raw: QueryResult;
  /** Parsed hottest node (only when format=='analyze' and the tree is available) */
  hottest: ExplainBottleneck | null;
  /** Notable plan flags pulled out of the tree (e.g. "Using temporary") */
  warnings: string[];
}
