import type { IDatabaseRepository } from '../../../domain/interfaces/database.repository.js';
import type { ISchemaRepository } from '../../../domain/interfaces/schema.repository.js';
import type { IQueryRepository } from '../../../domain/interfaces/query.repository.js';
import type {
  DatabaseInfo,
  SizeInfo,
  ServerInfo,
  StatusVariable,
  ConfigVariable,
  SchemaInfo,
  TableInfo,
  ColumnInfo,
  IndexInfo,
  ViewInfo,
  TriggerInfo,
  RoutineInfo,
  PartitionInfo,
  ForeignKeyInfo,
  SearchResult,
  ObjectType,
  QueryResult,
  ProcedureResult,
} from '../../../domain/entities.js';
import { quoteIdentifier } from '../../../domain/validators/identifier.validator.js';
import { isMariaDb } from './mysql.utils.js';
import type { MySqlAdapter } from './mysql.adapter.js';

// Row types for query results
interface SchemaRow { SCHEMA_NAME: string }
interface SizeRow { TABLE_SCHEMA: string; size_mb: number; table_count: number; row_count: number }
interface VersionRow { 'VERSION()': string }
interface UserDbRow { 'CURRENT_USER()': string; 'IFNULL(DATABASE(), \'\')': string }
interface StatusRow { Variable_name: string; Value: string }
interface TableRow { TABLE_NAME: string; TABLE_TYPE: string; ENGINE: string; TABLE_ROWS: number; DATA_LENGTH: number; INDEX_LENGTH: number; TABLE_COMMENT: string }
interface ColumnRow { COLUMN_NAME: string; COLUMN_TYPE: string; IS_NULLABLE: string; COLUMN_KEY: string; COLUMN_DEFAULT: string | null; EXTRA: string; COLUMN_COMMENT: string; COLLATION_NAME: string | null }
interface IndexRow { Key_name: string; Column_name: string; Non_unique: number; Index_type: string; Table: string; Cardinality: number; Seq_in_index: number }
interface ViewRow { TABLE_NAME: string; DEFINER: string; SECURITY_TYPE: string; IS_UPDATABLE: string }
interface TriggerRow { TRIGGER_NAME: string; EVENT_MANIPULATION: string; EVENT_OBJECT_TABLE: string; ACTION_TIMING: string; ACTION_STATEMENT: string }
interface RoutineRow { ROUTINE_NAME: string; ROUTINE_TYPE?: string; DEFINER: string; CREATED: string; LAST_ALTERED?: string; DTD_IDENTIFIER?: string; PARAMETER_STYLE?: string }
interface PartitionRow { PARTITION_NAME: string; PARTITION_METHOD: string; PARTITION_EXPRESSION: string; PARTITION_DESCRIPTION: string; TABLE_ROWS: number; DATA_LENGTH: number }
interface ForeignKeyRow { CONSTRAINT_NAME: string; TABLE_NAME: string; COLUMN_NAME: string; REFERENCED_TABLE_NAME: string; REFERENCED_COLUMN_NAME: string }
interface TableSizeRow { TABLE_NAME: string; TABLE_ROWS: number; data_mb: number; index_mb: number; total_mb: number }
interface CreateTableRow { Table: string; 'Create Table': string }
interface CreateProcedureRow { Procedure: string; 'Create Procedure': string; sql_mode: string }
interface SearchTableRow { TABLE_SCHEMA: string; TABLE_NAME: string; TABLE_TYPE: string }
interface SearchRoutineRow { ROUTINE_SCHEMA: string; ROUTINE_NAME: string; ROUTINE_TYPE: string }
interface SchemaAggRow { SCHEMA_NAME: string; tableCount: number; viewCount: number; procCount: number; funcCount: number; sizeMb: number }

export class MySqlRepository implements IDatabaseRepository, ISchemaRepository, IQueryRepository {
  constructor(
    private readonly adapter: MySqlAdapter,
    private readonly schemaExcludes: string[],
  ) { }

  private sanitizeIdentifier(name: string): string {
    return quoteIdentifier(name);
  }

  // ─── IDatabaseRepository ───────────────────────────────────────────

  async listDatabases(): Promise<DatabaseInfo[]> {
    const rows = await this.adapter.query<SchemaRow>(
      'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA ORDER BY SCHEMA_NAME',
    );
    return rows
      .filter((r) => !this.schemaExcludes.includes(r.SCHEMA_NAME))
      .map((r) => ({ name: r.SCHEMA_NAME }));
  }

  async databaseSize(database?: string): Promise<SizeInfo[]> {
    let sql = `SELECT TABLE_SCHEMA, ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb,
           COUNT(*) as table_count, SUM(TABLE_ROWS) as row_count
    FROM information_schema.TABLES`;
    const params: unknown[] = [];
    if (database) {
      sql += ' WHERE TABLE_SCHEMA = ?';
      params.push(database);
    }
    sql += ' GROUP BY TABLE_SCHEMA';
    const rows = await this.adapter.query<SizeRow>(sql, params);
    return rows.map((r) => ({
      name: r.TABLE_SCHEMA,
      dataMb: 0,
      indexMb: 0,
      totalMb: Number(r.size_mb) || 0,
      rowCount: Number(r.row_count) || 0,
    }));
  }

  async ping(): Promise<number> {
    return this.adapter.ping();
  }

  async serverInfo(): Promise<ServerInfo> {
    const [versionRows] = await Promise.all([
      this.adapter.query<VersionRow>('SELECT VERSION()'),
    ]);
    const version = versionRows[0]?.['VERSION()'] ?? '';

    const userRows = await this.adapter.query<Record<string, string>>(
      "SELECT CURRENT_USER() as current_user_val, IFNULL(DATABASE(), '') as current_db",
    );
    const currentUser = userRows[0]?.current_user_val ?? '';
    const currentDatabase = userRows[0]?.current_db ?? '';

    const statusRows = await this.adapter.query<StatusRow>(
      "SHOW GLOBAL STATUS LIKE 'Uptime'",
    );
    const uptime = Number(statusRows[0]?.Value) || 0;

    return {
      version,
      uptime,
      isMariaDb: isMariaDb(version),
      currentUser,
      currentDatabase,
    };
  }

  async listStatus(filter?: string): Promise<StatusVariable[]> {
    let sql = 'SHOW GLOBAL STATUS';
    const params: unknown[] = [];
    if (filter) {
      sql = 'SHOW GLOBAL STATUS LIKE ?';
      params.push(`%${filter}%`);
    }
    const rows = await this.adapter.query<StatusRow>(sql, params);
    return rows.map((r) => ({
      name: r.Variable_name,
      value: r.Value,
    }));
  }

  async listVariables(filter?: string): Promise<ConfigVariable[]> {
    let sql = 'SHOW GLOBAL VARIABLES';
    const params: unknown[] = [];
    if (filter) {
      sql = 'SHOW GLOBAL VARIABLES LIKE ?';
      params.push(`%${filter}%`);
    }
    const rows = await this.adapter.query<StatusRow>(sql, params);
    return rows.map((r) => ({
      name: r.Variable_name,
      value: r.Value,
    }));
  }

  // ─── ISchemaRepository ─────────────────────────────────────────────

  async listSchemas(filter?: string): Promise<SchemaInfo[]> {
    let sql = 'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA';
    const params: unknown[] = [];
    if (filter) {
      sql += ' WHERE SCHEMA_NAME LIKE ?';
      params.push(`%${filter}%`);
    }
    sql += ' ORDER BY SCHEMA_NAME';
    const schemaRows = await this.adapter.query<SchemaRow>(sql, params);
    const schemas = schemaRows
      .filter((r) => !this.schemaExcludes.includes(r.SCHEMA_NAME))
      .map((r) => r.SCHEMA_NAME);

    const result: SchemaInfo[] = [];
    for (const name of schemas) {
      const aggRows = await this.adapter.query<SchemaAggRow>(
        `SELECT
          s.SCHEMA_NAME,
          IFNULL(t.tableCount, 0) as tableCount,
          IFNULL(t.viewCount, 0) as viewCount,
          IFNULL(p.procCount, 0) as procCount,
          IFNULL(f.funcCount, 0) as funcCount,
          IFNULL(t.sizeMb, 0) as sizeMb
        FROM (SELECT ? as SCHEMA_NAME) s
        LEFT JOIN (
          SELECT TABLE_SCHEMA,
            SUM(CASE WHEN TABLE_TYPE = 'BASE TABLE' THEN 1 ELSE 0 END) as tableCount,
            SUM(CASE WHEN TABLE_TYPE = 'VIEW' THEN 1 ELSE 0 END) as viewCount,
            ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as sizeMb
          FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?
          GROUP BY TABLE_SCHEMA
        ) t ON s.SCHEMA_NAME = t.TABLE_SCHEMA
        LEFT JOIN (
          SELECT ROUTINE_SCHEMA, COUNT(*) as procCount
          FROM information_schema.ROUTINES
          WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
          GROUP BY ROUTINE_SCHEMA
        ) p ON s.SCHEMA_NAME = p.ROUTINE_SCHEMA
        LEFT JOIN (
          SELECT ROUTINE_SCHEMA, COUNT(*) as funcCount
          FROM information_schema.ROUTINES
          WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'FUNCTION'
          GROUP BY ROUTINE_SCHEMA
        ) f ON s.SCHEMA_NAME = f.ROUTINE_SCHEMA`,
        [name, name, name, name],
      );
      const row = aggRows[0];
      result.push({
        name,
        tableCount: Number(row?.tableCount) || 0,
        viewCount: Number(row?.viewCount) || 0,
        procedureCount: Number(row?.procCount) || 0,
        functionCount: Number(row?.funcCount) || 0,
        sizeMb: Number(row?.sizeMb) || 0,
      });
    }
    return result;
  }

  async switchSchema(schema: string): Promise<void> {
    const quoted = this.sanitizeIdentifier(schema);
    await this.adapter.query(`USE ${quoted}`);
  }

  async listTables(schema: string): Promise<TableInfo[]> {
    const rows = await this.adapter.query<TableRow>(
      `SELECT TABLE_NAME, TABLE_TYPE, ENGINE, TABLE_ROWS,
              DATA_LENGTH, INDEX_LENGTH, TABLE_COMMENT
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME`,
      [schema],
    );
    return rows.map((r) => ({
      name: r.TABLE_NAME,
      schema,
      engine: r.ENGINE || '',
      rowCount: Number(r.TABLE_ROWS) || 0,
      sizeMb: Number(((r.DATA_LENGTH || 0) + (r.INDEX_LENGTH || 0)) / 1024 / 1024) || 0,
      comment: r.TABLE_COMMENT || '',
      type: r.TABLE_TYPE === 'VIEW' ? 'VIEW' as const : 'TABLE' as const,
    }));
  }

  async describeTable(schema: string, table: string): Promise<ColumnInfo[]> {
    const rows = await this.adapter.query<ColumnRow>(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT,
              EXTRA, COLUMN_COMMENT, COLLATION_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION`,
      [schema, table],
    );
    return rows.map((r) => ({
      name: r.COLUMN_NAME,
      type: r.COLUMN_TYPE,
      nullable: r.IS_NULLABLE === 'YES',
      key: (r.COLUMN_KEY || '') as ColumnInfo['key'],
      defaultValue: r.COLUMN_DEFAULT,
      extra: r.EXTRA || '',
      comment: r.COLUMN_COMMENT || '',
      collation: r.COLLATION_NAME || null,
    }));
  }

  async listIndexes(schema: string, table: string): Promise<IndexInfo[]> {
    const quotedSchema = this.sanitizeIdentifier(schema);
    const quotedTable = this.sanitizeIdentifier(table);
    const rows = await this.adapter.query<IndexRow>(
      `SHOW INDEX FROM ${quotedSchema}.${quotedTable}`,
    );

    const grouped = new Map<string, IndexRow[]>();
    for (const row of rows) {
      const existing = grouped.get(row.Key_name) || [];
      existing.push(row);
      grouped.set(row.Key_name, existing);
    }

    const result: IndexInfo[] = [];
    for (const [name, indexRows] of grouped) {
      const sorted = indexRows.sort((a, b) => a.Seq_in_index - b.Seq_in_index);
      const first = sorted[0];
      result.push({
        name,
        columns: sorted.map((r) => r.Column_name),
        unique: first.Non_unique === 0,
        type: first.Index_type,
        table: first.Table,
        nonUnique: first.Non_unique === 1,
        cardinality: Number(first.Cardinality) || 0,
      });
    }
    return result;
  }

  // ─── ISchemaRepository (remaining) ─────────────────────────────────

  async listViews(schema: string): Promise<ViewInfo[]> {
    const rows = await this.adapter.query<ViewRow>(
      `SELECT TABLE_NAME, DEFINER, SECURITY_TYPE, IS_UPDATABLE
       FROM information_schema.VIEWS
       WHERE TABLE_SCHEMA = ?`,
      [schema],
    );
    return rows.map((r) => ({
      name: r.TABLE_NAME,
      definer: r.DEFINER,
      securityType: r.SECURITY_TYPE,
      isUpdatable: r.IS_UPDATABLE === 'YES',
    }));
  }

  async listTriggers(schema: string): Promise<TriggerInfo[]> {
    const rows = await this.adapter.query<TriggerRow>(
      `SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE,
              ACTION_TIMING, LEFT(ACTION_STATEMENT, 200) AS ACTION_STATEMENT
       FROM information_schema.TRIGGERS
       WHERE TRIGGER_SCHEMA = ?`,
      [schema],
    );
    return rows.map((r) => ({
      name: r.TRIGGER_NAME,
      event: r.EVENT_MANIPULATION,
      table: r.EVENT_OBJECT_TABLE,
      timing: r.ACTION_TIMING,
      statement: r.ACTION_STATEMENT,
    }));
  }

  async listProcedures(schema: string): Promise<RoutineInfo[]> {
    const rows = await this.adapter.query<RoutineRow>(
      `SELECT ROUTINE_NAME, DEFINER, CREATED, LAST_ALTERED,
              IFNULL(PARAMETER_STYLE, '') AS PARAMETER_STYLE
       FROM information_schema.ROUTINES
       WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'`,
      [schema],
    );
    return rows.map((r) => ({
      name: r.ROUTINE_NAME,
      type: 'PROCEDURE' as const,
      definer: r.DEFINER,
      created: String(r.CREATED || ''),
      lastAltered: String(r.LAST_ALTERED || ''),
      dtdIdentifier: '',
      parameterStyle: r.PARAMETER_STYLE || '',
    }));
  }

  async listFunctions(schema: string): Promise<RoutineInfo[]> {
    const rows = await this.adapter.query<RoutineRow>(
      `SELECT ROUTINE_NAME, DEFINER, DTD_IDENTIFIER, CREATED
       FROM information_schema.ROUTINES
       WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'FUNCTION'`,
      [schema],
    );
    return rows.map((r) => ({
      name: r.ROUTINE_NAME,
      type: 'FUNCTION' as const,
      definer: r.DEFINER,
      created: String(r.CREATED || ''),
      lastAltered: '',
      dtdIdentifier: r.DTD_IDENTIFIER || '',
      parameterStyle: '',
    }));
  }

  async listPartitions(schema: string, table: string): Promise<PartitionInfo[]> {
    const rows = await this.adapter.query<PartitionRow>(
      `SELECT PARTITION_NAME, PARTITION_METHOD, PARTITION_EXPRESSION,
              PARTITION_DESCRIPTION, TABLE_ROWS, DATA_LENGTH
       FROM information_schema.PARTITIONS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND PARTITION_NAME IS NOT NULL`,
      [schema, table],
    );
    return rows.map((r) => ({
      name: r.PARTITION_NAME,
      method: r.PARTITION_METHOD || '',
      expression: r.PARTITION_EXPRESSION || '',
      description: r.PARTITION_DESCRIPTION || '',
      rowCount: Number(r.TABLE_ROWS) || 0,
      dataLength: Number(r.DATA_LENGTH) || 0,
    }));
  }

  async foreignKeys(schema: string, table: string): Promise<ForeignKeyInfo[]> {
    const rows = await this.adapter.query<ForeignKeyRow>(
      `SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME,
              REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = ?
             AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [schema, table],
    );
    return rows.map((r) => ({
      constraintName: r.CONSTRAINT_NAME,
      tableName: r.TABLE_NAME,
      columnName: r.COLUMN_NAME,
      referencedTableName: r.REFERENCED_TABLE_NAME,
      referencedColumnName: r.REFERENCED_COLUMN_NAME,
    }));
  }

  async tableSize(schema: string, table?: string): Promise<SizeInfo[]> {
    let sql = `SELECT TABLE_NAME, TABLE_ROWS,
           ROUND(DATA_LENGTH / 1024 / 1024, 2) as data_mb,
           ROUND(INDEX_LENGTH / 1024 / 1024, 2) as index_mb,
           ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as total_mb
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ?`;
    const params: unknown[] = [schema];
    if (table) {
      sql += ' AND TABLE_NAME = ?';
      params.push(table);
    }
    const rows = await this.adapter.query<TableSizeRow>(sql, params);
    return rows.map((r) => ({
      name: r.TABLE_NAME,
      dataMb: Number(r.data_mb) || 0,
      indexMb: Number(r.index_mb) || 0,
      totalMb: Number(r.total_mb) || 0,
      rowCount: Number(r.TABLE_ROWS) || 0,
    }));
  }

  async showCreateTable(schema: string, table: string): Promise<string> {
    const quotedSchema = this.sanitizeIdentifier(schema);
    const quotedTable = this.sanitizeIdentifier(table);
    const rows = await this.adapter.query<CreateTableRow>(
      `SHOW CREATE TABLE ${quotedSchema}.${quotedTable}`,
    );
    return rows[0]?.['Create Table'] ?? '';
  }

  async showCreateProcedure(schema: string, procedure: string): Promise<string> {
    const quotedSchema = this.sanitizeIdentifier(schema);
    const quotedProcedure = this.sanitizeIdentifier(procedure);
    const rows = await this.adapter.query<CreateProcedureRow>(
      `SHOW CREATE PROCEDURE ${quotedSchema}.${quotedProcedure}`,
    );
    return rows[0]?.['Create Procedure'] ?? '';
  }

  async callProcedure(schema: string, procedure: string, args: unknown[]): Promise<ProcedureResult> {
    const quotedSchema = this.sanitizeIdentifier(schema);
    const quotedProcedure = this.sanitizeIdentifier(procedure);
    const placeholders = args.length > 0 ? args.map(() => '?').join(', ') : '';
    const sql = `CALL ${quotedSchema}.${quotedProcedure}(${placeholders})`;

    const start = Date.now();
    const resultSets = await this.adapter.callProcedure(sql, args);
    const durationMs = Date.now() - start;

    return {
      procedureName: procedure,
      resultSets: resultSets.map((rows) => ({
        columns: rows.length > 0 ? Object.keys(rows[0]) : [],
        rows,
        rowCount: rows.length,
      })),
      durationMs,
    };
  }

  async searchObjects(name: string, type?: ObjectType): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    if (!type || type === 'table' || type === 'view') {
      let sql = `SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
        FROM information_schema.TABLES
        WHERE TABLE_NAME LIKE ?`;
      const params: unknown[] = [`%${name}%`];
      if (type === 'table') {
        sql += " AND TABLE_TYPE = 'BASE TABLE'";
      } else if (type === 'view') {
        sql += " AND TABLE_TYPE = 'VIEW'";
      }
      const rows = await this.adapter.query<SearchTableRow>(sql, params);
      for (const r of rows) {
        results.push({
          schema: r.TABLE_SCHEMA,
          objectName: r.TABLE_NAME,
          objectType: r.TABLE_TYPE === 'VIEW' ? 'view' : 'table',
        });
      }
    }

    if (!type || type === 'procedure' || type === 'function') {
      let sql = `SELECT ROUTINE_SCHEMA, ROUTINE_NAME, ROUTINE_TYPE
        FROM information_schema.ROUTINES
        WHERE ROUTINE_NAME LIKE ?`;
      const params: unknown[] = [`%${name}%`];
      if (type === 'procedure') {
        sql += " AND ROUTINE_TYPE = 'PROCEDURE'";
      } else if (type === 'function') {
        sql += " AND ROUTINE_TYPE = 'FUNCTION'";
      }
      const rows = await this.adapter.query<SearchRoutineRow>(sql, params);
      for (const r of rows) {
        results.push({
          schema: r.ROUTINE_SCHEMA,
          objectName: r.ROUTINE_NAME,
          objectType: r.ROUTINE_TYPE === 'FUNCTION' ? 'function' : 'procedure',
        });
      }
    }

    return results;
  }

  // ─── IQueryRepository ──────────────────────────────────────────────

  async executeQuery(sql: string, params: unknown[], maxRows: number, timeoutSeconds: number): Promise<QueryResult> {
    let querySql = sql.trim();
    if (!/\bLIMIT\b/i.test(querySql)) {
      querySql = querySql.replace(/;\s*$/, '');
      querySql += ` LIMIT ${maxRows + 1}`;
    }

    const start = Date.now();
    const rows = await this.adapter.query<Record<string, unknown>>(querySql, params, timeoutSeconds * 1000);
    const durationMs = Date.now() - start;

    let truncated = false;
    if (rows.length > maxRows) {
      rows.length = maxRows;
      truncated = true;
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      columns,
      rows,
      rowCount: rows.length,
      durationMs,
      truncated,
    };
  }

  async explainQuery(sql: string): Promise<QueryResult> {
    const explainSql = `EXPLAIN ${sql.trim().replace(/;\s*$/, '')}`;
    const start = Date.now();
    const rows = await this.adapter.query<Record<string, unknown>>(explainSql);
    const durationMs = Date.now() - start;
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      columns,
      rows,
      rowCount: rows.length,
      durationMs,
      truncated: false,
    };
  }
}
