import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createDescribeTableTool(service: SchemaService): ToolDefinition {
  return {
    name: 'describe_table',
    description: 'Describe the columns of a table',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name'),
      table: z.string().describe('Table name'),
    }),
    handler: async (input: { schema: string; table: string }): Promise<ToolResponse> => {
      const columns = await service.describeTable(input.schema, input.table);
      return { content: [{ type: 'text', text: JSON.stringify(columns, null, 2) }] };
    },
    group: 'core',
  };
}
