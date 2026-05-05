import { z } from 'zod';
import type { QueryService } from '../../application/services/query.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

/**
 * Run a read-only query OR a stored procedure CALL with MySQL session
 * profiling enabled, then return the result + per-statement timings as
 * reported by SHOW PROFILES. The profiling SET statements are hard-coded
 * server-side — user input never reaches a SET.
 */
export function createProfileQueryTool(service: QueryService): ToolDefinition {
  return {
    name: 'profile_query',
    description:
      'Profile a read-only query or CALL proc(...). Returns the result + per-statement timings (SHOW PROFILES) and the slowest entry. Use to localize bottlenecks inside stored procedures.',
    inputSchema: z.object({
      query: z.string().optional().describe('Read-only SQL to profile (mutually exclusive with procedure)'),
      schema: z.string().optional().describe('Schema for the procedure call'),
      procedure: z.string().optional().describe('Stored procedure name'),
      args: z
        .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
        .optional()
        .describe('Procedure arguments in order'),
    }),
    handler: async (input: {
      query?: string;
      schema?: string;
      procedure?: string;
      args?: Array<string | number | boolean | null>;
    }): Promise<ToolResponse> => {
      if (input.procedure) {
        if (!input.schema) {
          throw new Error('schema is required when profiling a procedure');
        }
        const result = await service.profileProcedure(
          input.schema,
          input.procedure,
          input.args ?? [],
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      if (!input.query) {
        throw new Error('Either query or procedure must be provided');
      }
      const result = await service.profileQuery(input.query, input.schema);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
    group: 'extended',
  };
}
