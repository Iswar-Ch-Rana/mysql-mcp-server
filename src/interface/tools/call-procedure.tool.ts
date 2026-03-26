import { z } from 'zod';
import type { QueryService } from '../../application/services/query.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createCallProcedureTool(service: QueryService): ToolDefinition {
  return {
    name: 'call_procedure',
    description:
      'Execute a stored procedure and return all result sets. ' +
      'Use list_procedures to discover available procedures and ' +
      'show_create_procedure to inspect parameter signatures.',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name where the procedure lives'),
      procedure: z.string().describe('Stored procedure name'),
      args: z
        .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
        .optional()
        .describe('Ordered list of IN/INOUT arguments to pass to the procedure'),
    }),
    handler: async (input: {
      schema: string;
      procedure: string;
      args?: Array<string | number | boolean | null>;
    }): Promise<ToolResponse> => {
      const result = await service.callProcedure(
        input.schema,
        input.procedure,
        input.args ?? [],
      );
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
    group: 'extended',
  };
}
