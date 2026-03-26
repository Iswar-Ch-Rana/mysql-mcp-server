import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createTableSizeTool(service: SchemaService): ToolDefinition {
  return {
    name: 'table_size',
    description: 'Get the size of tables in a schema',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name'),
      table: z.string().optional().describe('Table name (omit for all tables)'),
    }),
    handler: async (input: { schema: string; table?: string }): Promise<ToolResponse> => {
      const sizes = await service.tableSize(input.schema, input.table);
      return { content: [{ type: 'text', text: JSON.stringify(sizes, null, 2) }] };
    },
    group: 'extended',
  };
}
