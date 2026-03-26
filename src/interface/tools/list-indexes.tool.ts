import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createListIndexesTool(service: SchemaService): ToolDefinition {
  return {
    name: 'list_indexes',
    description: 'List all indexes on a table',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name'),
      table: z.string().describe('Table name'),
    }),
    handler: async (input: { schema: string; table: string }): Promise<ToolResponse> => {
      const indexes = await service.listIndexes(input.schema, input.table);
      return { content: [{ type: 'text', text: JSON.stringify(indexes, null, 2) }] };
    },
    group: 'extended',
  };
}
