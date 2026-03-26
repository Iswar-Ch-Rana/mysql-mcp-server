import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createShowCreateTableTool(service: SchemaService): ToolDefinition {
  return {
    name: 'show_create_table',
    description: 'Show the CREATE TABLE DDL statement for a table',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name'),
      table: z.string().describe('Table name'),
    }),
    handler: async (input: { schema: string; table: string }): Promise<ToolResponse> => {
      const ddl = await service.showCreateTable(input.schema, input.table);
      return { content: [{ type: 'text', text: ddl }] };
    },
    group: 'extended',
  };
}
