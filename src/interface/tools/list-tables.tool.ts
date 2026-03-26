import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createListTablesTool(service: SchemaService): ToolDefinition {
  return {
    name: 'list_tables',
    description: 'List all tables in a schema/database',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name'),
    }),
    handler: async (input: { schema: string }): Promise<ToolResponse> => {
      const tables = await service.listTables(input.schema);
      return { content: [{ type: 'text', text: JSON.stringify(tables, null, 2) }] };
    },
    group: 'core',
  };
}
