import { z } from 'zod';
import type { DatabaseService } from '../../application/services/database.service.js';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { QueryService } from '../../application/services/query.service.js';
import type { ConnectionService } from '../../application/services/connection.service.js';
import type { IndexHealthService } from '../../application/services/index-health.service.js';
import type { FeatureFlags } from '../../shared/config.js';

import { createListDatabasesTool } from './list-databases.tool.js';
import { createListTablesTool } from './list-tables.tool.js';
import { createDescribeTableTool } from './describe-table.tool.js';
import { createRunQueryTool } from './run-query.tool.js';
import { createServerInfoTool } from './server-info.tool.js';
import { createListSchemasTool } from './list-schemas.tool.js';
import { createUseSchemaTool } from './use-schema.tool.js';
import { createDescribeSchemaTool } from './describe-schema.tool.js';
import { createSchemaSearchTool } from './schema-search.tool.js';
import { createListConnectionsTool } from './list-connections.tool.js';
import { createUseConnectionTool } from './use-connection.tool.js';
import { createListIndexesTool } from './list-indexes.tool.js';
import { createShowCreateTableTool } from './show-create-table.tool.js';
import { createExplainQueryTool } from './explain-query.tool.js';
import { createListProceduresTool } from './list-procedures.tool.js';
import { createShowCreateProcedureTool } from './show-create-procedure.tool.js';
import { createCallProcedureTool } from './call-procedure.tool.js';
import { createProfileQueryTool } from './profile-query.tool.js';
import { createTopSlowQueriesTool } from './top-slow-queries.tool.js';
import { createProcessListTool } from './processlist.tool.js';
import { createIndexHealthTool } from './index-health.tool.js';
import { createListObjectsTool } from './list-objects.tool.js';

export type ToolResponse = { content: { type: string; text: string }[] };

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  handler: (input: any) => Promise<ToolResponse>;
  group: 'core' | 'schema' | 'extended' | 'connection';
}

export interface Services {
  database: DatabaseService;
  schema: SchemaService;
  query: QueryService;
  connection: ConnectionService;
  indexHealth: IndexHealthService;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  buildAll(services: Services, flags: FeatureFlags): void {
    // Core (always)
    this.register(createListDatabasesTool(services.database));
    this.register(createListTablesTool(services.schema));
    this.register(createDescribeTableTool(services.schema));
    this.register(createRunQueryTool(services.query));
    this.register(createServerInfoTool(services.database));

    // Schema (always)
    this.register(createListSchemasTool(services.schema));
    this.register(createUseSchemaTool(services.schema));
    this.register(createDescribeSchemaTool(services.schema));
    this.register(createSchemaSearchTool(services.schema));

    // Connection (always)
    this.register(createListConnectionsTool(services.connection));
    this.register(createUseConnectionTool(services.connection));

    // Extended (feature-flagged)
    if (flags.extendedTools) {
      this.register(createListIndexesTool(services.schema));
      this.register(createShowCreateTableTool(services.schema));
      this.register(createExplainQueryTool(services.query));
      this.register(createListProceduresTool(services.schema));
      this.register(createShowCreateProcedureTool(services.schema));
      this.register(createCallProcedureTool(services.query));
      this.register(createProfileQueryTool(services.query));
      this.register(createTopSlowQueriesTool(services.query));
      this.register(createProcessListTool(services.query));
      this.register(createIndexHealthTool(services.indexHealth));
      this.register(createListObjectsTool(services.schema, services.database));
    }
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getNames(): string[] {
    return Array.from(this.tools.keys());
  }
}
