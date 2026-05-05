import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../../src/interface/tools/registry.js';
import {
  MockDatabaseRepository,
  MockSchemaRepository,
  MockQueryRepository,
  MockSqlValidator,
  MockAuditLogger,
  MockLogger,
} from '../mocks/index.js';
import { DatabaseService } from '../../src/application/services/database.service.js';
import { SchemaService } from '../../src/application/services/schema.service.js';
import { QueryService } from '../../src/application/services/query.service.js';
import { ConnectionService } from '../../src/application/services/connection.service.js';
import { IndexHealthService } from '../../src/application/services/index-health.service.js';
import type { FeatureFlags } from '../../src/shared/config.js';

function createServices() {
  const logger = new MockLogger();
  const dbRepo = new MockDatabaseRepository();
  const schemaRepo = new MockSchemaRepository();
  const queryRepo = new MockQueryRepository();
  const validator = new MockSqlValidator();
  const auditLogger = new MockAuditLogger();

  return {
    database: new DatabaseService(dbRepo as any, logger),
    schema: new SchemaService(schemaRepo as any, logger),
    query: new QueryService(queryRepo, validator, auditLogger, 200, 30),
    connection: new ConnectionService(
      { default: { name: 'default', dsn: 'mysql://root@localhost/test' } },
      logger,
    ),
    indexHealth: new IndexHealthService(schemaRepo as any, queryRepo as any),
  };
}

// 5 core + 4 schema + 2 connection = 11
const BASE_COUNT = 11;
// list_indexes, show_create_table, explain_query, list_procedures,
// show_create_procedure, call_procedure, profile_query,
// top_slow_queries, processlist, index_health, list_objects = 11
const EXTENDED_COUNT = 11;
const FULL_COUNT = BASE_COUNT + EXTENDED_COUNT;

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('should register and retrieve a tool', () => {
    registry.register({
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: {} as any,
      handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      group: 'core',
    });
    expect(registry.get('test_tool')).toBeDefined();
    expect(registry.get('test_tool')!.name).toBe('test_tool');
  });

  it('should return undefined for unknown tool', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('should return all registered tools', () => {
    registry.register({
      name: 'tool1',
      description: 'Tool 1',
      inputSchema: {} as any,
      handler: async () => ({ content: [{ type: 'text', text: '' }] }),
      group: 'core',
    });
    registry.register({
      name: 'tool2',
      description: 'Tool 2',
      inputSchema: {} as any,
      handler: async () => ({ content: [{ type: 'text', text: '' }] }),
      group: 'core',
    });
    expect(registry.getAll()).toHaveLength(2);
    expect(registry.getNames()).toEqual(['tool1', 'tool2']);
  });

  describe('buildAll', () => {
    it('should register only core + schema + connection tools when extendedTools is false', () => {
      const services = createServices();
      const flags: FeatureFlags = { extendedTools: false, tokenTracking: false };

      registry.buildAll(services, flags);

      expect(registry.getAll()).toHaveLength(BASE_COUNT);
      // Core
      expect(registry.getNames()).toContain('list_databases');
      expect(registry.getNames()).toContain('list_tables');
      expect(registry.getNames()).toContain('describe_table');
      expect(registry.getNames()).toContain('run_query');
      expect(registry.getNames()).toContain('server_info');
      // Schema
      expect(registry.getNames()).toContain('list_schemas');
      expect(registry.getNames()).toContain('use_schema');
      expect(registry.getNames()).toContain('describe_schema');
      expect(registry.getNames()).toContain('schema_search');
      // Connection
      expect(registry.getNames()).toContain('list_connections');
      expect(registry.getNames()).toContain('use_connection');
      // Dropped + extended not present
      expect(registry.getNames()).not.toContain('ping');
      expect(registry.getNames()).not.toContain('list_indexes');
      expect(registry.getNames()).not.toContain('profile_query');
    });

    it('should register all tools when extendedTools is true', () => {
      const services = createServices();
      const flags: FeatureFlags = { extendedTools: true, tokenTracking: false };

      registry.buildAll(services, flags);

      expect(registry.getAll()).toHaveLength(FULL_COUNT);
      // Extended
      expect(registry.getNames()).toContain('list_indexes');
      expect(registry.getNames()).toContain('show_create_table');
      expect(registry.getNames()).toContain('explain_query');
      expect(registry.getNames()).toContain('list_procedures');
      expect(registry.getNames()).toContain('show_create_procedure');
      expect(registry.getNames()).toContain('call_procedure');
      expect(registry.getNames()).toContain('profile_query');
      expect(registry.getNames()).toContain('top_slow_queries');
      expect(registry.getNames()).toContain('processlist');
      expect(registry.getNames()).toContain('index_health');
      expect(registry.getNames()).toContain('list_objects');
      // Dropped tools absent
      expect(registry.getNames()).not.toContain('ping');
      expect(registry.getNames()).not.toContain('compare_procedures');
      expect(registry.getNames()).not.toContain('foreign_keys');
      expect(registry.getNames()).not.toContain('database_size');
      expect(registry.getNames()).not.toContain('table_size');
      expect(registry.getNames()).not.toContain('list_views');
      expect(registry.getNames()).not.toContain('list_triggers');
      expect(registry.getNames()).not.toContain('list_functions');
      expect(registry.getNames()).not.toContain('list_partitions');
      expect(registry.getNames()).not.toContain('list_status');
      expect(registry.getNames()).not.toContain('list_variables');
    });

    it(`should have ${BASE_COUNT} base tools and ${FULL_COUNT} total`, () => {
      const services = createServices();

      registry.buildAll(services, { extendedTools: false, tokenTracking: false });
      const baseCount = registry.getAll().length;

      const registry2 = new ToolRegistry();
      registry2.buildAll(services, { extendedTools: true, tokenTracking: false });
      const fullCount = registry2.getAll().length;

      expect(baseCount).toBe(BASE_COUNT);
      expect(fullCount).toBe(FULL_COUNT);
      expect(fullCount - baseCount).toBe(EXTENDED_COUNT);
    });
  });
});
