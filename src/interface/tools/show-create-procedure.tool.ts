import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createShowCreateProcedureTool(service: SchemaService): ToolDefinition {
  return {
    name: 'show_create_procedure',
    description: 'Show the full CREATE PROCEDURE source code for a stored procedure',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name'),
      procedure: z.string().describe('Stored procedure name'),
    }),
    handler: async (input: { schema: string; procedure: string }): Promise<ToolResponse> => {
      const sql = await service.showCreateProcedure(input.schema, input.procedure);
      return { content: [{ type: 'text', text: sql }] };
    },
    group: 'extended',
  };
}
