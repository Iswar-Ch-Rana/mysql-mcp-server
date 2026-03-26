import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createListProceduresTool(service: SchemaService): ToolDefinition {
  return {
    name: 'list_procedures',
    description: 'List all stored procedures in a schema',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name'),
    }),
    handler: async (input: { schema: string }): Promise<ToolResponse> => {
      const procedures = await service.listProcedures(input.schema);
      return { content: [{ type: 'text', text: JSON.stringify(procedures, null, 2) }] };
    },
    group: 'extended',
  };
}
