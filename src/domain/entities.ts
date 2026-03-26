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
