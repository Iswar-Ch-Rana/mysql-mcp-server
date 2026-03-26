import { z } from 'zod';
import type { DatabaseService } from '../../application/services/database.service.js';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { QueryService } from '../../application/services/query.service.js';
import type { ConnectionService } from '../../application/services/connection.service.js';
import type { FeatureFlags } from '../../shared/config.js';

import { createListDatabasesTool } from './list-databases.tool.js';
import { createListTablesTool } from './list-tables.tool.js';
import { createDescribeTableTool } from './describe-table.tool.js';
import { createRunQueryTool } from './run-query.tool.js';
import { createPingTool } from './ping.tool.js';
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
import { createListViewsTool } from './list-views.tool.js';
import { createListTriggersTool } from './list-triggers.tool.js';
import { createListProceduresTool } from './list-procedures.tool.js';
import { createShowCreateProcedureTool } from './show-create-procedure.tool.js';
import { createCallProcedureTool } from './call-procedure.tool.js';
import { createCompareProceduresTool } from './compare-procedures.tool.js';
import { createListFunctionsTool } from './list-functions.tool.js';
import { createListPartitionsTool } from './list-partitions.tool.js';
import { createDatabaseSizeTool } from './database-size.tool.js';
import { createTableSizeTool } from './table-size.tool.js';
import { createForeignKeysTool } from './foreign-keys.tool.js';
import { createListStatusTool } from './list-status.tool.js';
import { createListVariablesTool } from './list-variables.tool.js';

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
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  buildAll(services: Services, flags: FeatureFlags): void {
    // Core tools (always registered)
    this.register(createListDatabasesTool(services.database));
    this.register(createListTablesTool(services.schema));
    this.register(createDescribeTableTool(services.schema));
    this.register(createRunQueryTool(services.query));
    this.register(createPingTool(services.database));
    this.register(createServerInfoTool(services.database));

    // Schema tools (always registered)
    this.register(createListSchemasTool(services.schema));
    this.register(createUseSchemaTool(services.schema));
    this.register(createDescribeSchemaTool(services.schema));
    this.register(createSchemaSearchTool(services.schema));

    // Connection tools (always registered)
    this.register(createListConnectionsTool(services.connection));
    this.register(createUseConnectionTool(services.connection));

    // Extended tools (only if feature flag enabled)
    if (flags.extendedTools) {
      this.register(createListIndexesTool(services.schema));
      this.register(createShowCreateTableTool(services.schema));
      this.register(createExplainQueryTool(services.query));
      this.register(createListViewsTool(services.schema));
      this.register(createListTriggersTool(services.schema));
      this.register(createListProceduresTool(services.schema));
      this.register(createShowCreateProcedureTool(services.schema));
      this.register(createCallProcedureTool(services.query));
      this.register(createCompareProceduresTool(services.query));
      this.register(createListFunctionsTool(services.schema));
      this.register(createListPartitionsTool(services.schema));
      this.register(createDatabaseSizeTool(services.database));
      this.register(createTableSizeTool(services.schema));
      this.register(createForeignKeysTool(services.schema));
      this.register(createListStatusTool(services.database));
      this.register(createListVariablesTool(services.database));
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
