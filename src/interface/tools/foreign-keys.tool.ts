import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createForeignKeysTool(service: SchemaService): ToolDefinition {
  return {
    name: 'foreign_keys',
    description: 'List all foreign keys on a table',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name'),
      table: z.string().describe('Table name'),
    }),
    handler: async (input: { schema: string; table: string }): Promise<ToolResponse> => {
      const foreignKeys = await service.foreignKeys(input.schema, input.table);
      return { content: [{ type: 'text', text: JSON.stringify(foreignKeys, null, 2) }] };
    },
    group: 'extended',
  };
}
