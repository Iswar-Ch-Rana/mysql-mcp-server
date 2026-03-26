import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MySqlAdapter } from '../../src/infrastructure/database/mysql/mysql.adapter.js';
import { MySqlRepository } from '../../src/infrastructure/database/mysql/mysql.repository.js';

const DSN = process.env.MYSQL_DSN ?? 'mysql://root:root@localhost:3306/test';

describe('MySqlRepository Integration', () => {
  let adapter: MySqlAdapter;
  let repo: MySqlRepository;

  beforeAll(async () => {
    adapter = new MySqlAdapter();
    await adapter.connect(DSN, {
      maxOpen: 5,
      maxIdle: 2,
      maxLifetimeSeconds: 300,
    });
    repo = new MySqlRepository(adapter, []);
  });

  afterAll(async () => {
    await adapter.disconnect();
  });

  it('should list databases and return at least one schema', async () => {
    const databases = await repo.listDatabases();
    expect(databases.length).toBeGreaterThan(0);
  });

  it('should list tables for a known schema', async () => {
    const databases = await repo.listDatabases();
    const schemaName = databases[0].name;
    const tables = await repo.listTables(schemaName);
    expect(Array.isArray(tables)).toBe(true);
  });

  it('should describe a table and return columns', async () => {
    const databases = await repo.listDatabases();
    const schemaName = databases[0].name;
    const tables = await repo.listTables(schemaName);
    if (tables.length > 0) {
      const columns = await repo.describeTable(schemaName, tables[0].name);
      expect(columns.length).toBeGreaterThan(0);
      expect(columns[0]).toHaveProperty('name');
      expect(columns[0]).toHaveProperty('type');
    }
  });

  it('should execute a SELECT query and return QueryResult', async () => {
    const result = await repo.executeQuery('SELECT 1 AS value', [], 10, 30);
    expect(result.columns).toContain('value');
    expect(result.rows.length).toBe(1);
    expect(result.rowCount).toBe(1);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should ping and return latency > 0', async () => {
    const latency = await repo.ping();
    expect(latency).toBeGreaterThanOrEqual(0);
  });

  it('should return server info with version string', async () => {
    const info = await repo.serverInfo();
    expect(info.version).toBeTruthy();
    expect(typeof info.version).toBe('string');
    expect(typeof info.uptime).toBe('number');
  });
});
