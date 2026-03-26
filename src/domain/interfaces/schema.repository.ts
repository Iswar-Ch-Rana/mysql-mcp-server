import type {
  SchemaInfo,
  TableInfo,
  ColumnInfo,
  IndexInfo,
  ViewInfo,
  TriggerInfo,
  RoutineInfo,
  PartitionInfo,
  ForeignKeyInfo,
  SizeInfo,
  SearchResult,
  ObjectType,
  ProcedureResult,
} from '../entities.js';

export interface ISchemaRepository {
  listSchemas(filter?: string): Promise<SchemaInfo[]>;
  switchSchema(schema: string): Promise<void>;
  listTables(schema: string): Promise<TableInfo[]>;
  describeTable(schema: string, table: string): Promise<ColumnInfo[]>;
  listIndexes(schema: string, table: string): Promise<IndexInfo[]>;
  listViews(schema: string): Promise<ViewInfo[]>;
  listTriggers(schema: string): Promise<TriggerInfo[]>;
  listProcedures(schema: string): Promise<RoutineInfo[]>;
  listFunctions(schema: string): Promise<RoutineInfo[]>;
  listPartitions(schema: string, table: string): Promise<PartitionInfo[]>;
  foreignKeys(schema: string, table: string): Promise<ForeignKeyInfo[]>;
  tableSize(schema: string, table?: string): Promise<SizeInfo[]>;
  showCreateTable(schema: string, table: string): Promise<string>;
  showCreateProcedure(schema: string, procedure: string): Promise<string>;
  callProcedure(schema: string, procedure: string, args: unknown[]): Promise<ProcedureResult>;
  searchObjects(name: string, type?: ObjectType): Promise<SearchResult[]>;
}
