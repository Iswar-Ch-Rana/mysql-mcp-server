import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createListPartitionsTool(service: SchemaService): ToolDefinition {
  return {
    name: 'list_partitions',
    description: 'List all partitions on a table',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name'),
      table: z.string().describe('Table name'),
    }),
    handler: async (input: { schema: string; table: string }): Promise<ToolResponse> => {
      const partitions = await service.listPartitions(input.schema, input.table);
      return { content: [{ type: 'text', text: JSON.stringify(partitions, null, 2) }] };
    },
    group: 'extended',
  };
}
