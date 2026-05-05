import { vi } from 'vitest';
import type { IDatabaseRepository } from '../../src/domain/interfaces/database.repository.js';
import type { ISchemaRepository } from '../../src/domain/interfaces/schema.repository.js';
import type { IQueryRepository } from '../../src/domain/interfaces/query.repository.js';
import type { ISqlValidator, ValidationResult } from '../../src/domain/interfaces/sql-validator.js';
import type { ILogger, IAuditLogger } from '../../src/domain/interfaces/logger.js';

export class MockDatabaseRepository implements IDatabaseRepository {
  listDatabases = vi.fn().mockResolvedValue([]);
  databaseSize = vi.fn().mockResolvedValue([]);
  ping = vi.fn().mockResolvedValue(1);
  serverInfo = vi.fn().mockResolvedValue({
    version: '8.0.0',
    uptime: 1000,
    isMariaDb: false,
    currentUser: 'test@localhost',
    currentDatabase: 'test',
  });
  listStatus = vi.fn().mockResolvedValue([]);
  listVariables = vi.fn().mockResolvedValue([]);
}

export class MockSchemaRepository implements ISchemaRepository {
  listSchemas = vi.fn().mockResolvedValue([]);
  switchSchema = vi.fn().mockResolvedValue(undefined);
  listTables = vi.fn().mockResolvedValue([]);
  describeTable = vi.fn().mockResolvedValue([]);
  listIndexes = vi.fn().mockResolvedValue([]);
  listViews = vi.fn().mockResolvedValue([]);
  listTriggers = vi.fn().mockResolvedValue([]);
  listProcedures = vi.fn().mockResolvedValue([]);
  listFunctions = vi.fn().mockResolvedValue([]);
  listPartitions = vi.fn().mockResolvedValue([]);
  foreignKeys = vi.fn().mockResolvedValue([]);
  tableSize = vi.fn().mockResolvedValue([]);
  showCreateTable = vi.fn().mockResolvedValue('CREATE TABLE test (id INT)');
  showCreateProcedure = vi.fn().mockResolvedValue('CREATE PROCEDURE test() BEGIN SELECT 1; END');
  searchObjects = vi.fn().mockResolvedValue([]);
}

export class MockQueryRepository implements IQueryRepository {
  executeQuery = vi.fn().mockResolvedValue({
    columns: ['id'],
    rows: [{ id: 1 }],
    rowCount: 1,
    durationMs: 10,
    truncated: false,
  });
  explainQuery = vi.fn().mockResolvedValue({
    columns: ['id', 'select_type', 'table'],
    rows: [{ id: 1, select_type: 'SIMPLE', table: 'test' }],
    rowCount: 1,
    durationMs: 5,
    truncated: false,
  });
  callProcedure = vi.fn().mockResolvedValue({
    procedureName: 'test',
    resultSets: [],
    durationMs: 5,
  });
  profileQuery = vi.fn().mockResolvedValue({
    resultSets: [],
    profile: [],
    hottest: null,
    totalMs: 10,
  });
  profileProcedure = vi.fn().mockResolvedValue({
    resultSets: [],
    profile: [],
    hottest: null,
    totalMs: 10,
  });
  topSlowQueries = vi.fn().mockResolvedValue([]);
  processList = vi.fn().mockResolvedValue([]);
  unusedIndexes = vi.fn().mockResolvedValue([]);
}

export class MockSqlValidator implements ISqlValidator {
  validate = vi.fn().mockReturnValue({ isValid: true } satisfies ValidationResult);
}

export class MockLogger implements ILogger {
  info = vi.fn();
  warn = vi.fn();
  error = vi.fn();
  debug = vi.fn();
}

export class MockAuditLogger implements IAuditLogger {
  logQuery = vi.fn();
}
