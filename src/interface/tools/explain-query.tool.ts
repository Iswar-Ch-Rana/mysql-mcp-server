import { z } from 'zod';
import type { QueryService } from '../../application/services/query.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createExplainQueryTool(service: QueryService): ToolDefinition {
  return {
    name: 'explain_query',
    description: 'Show the execution plan for a SQL query',
    inputSchema: z.object({
      query: z.string().describe('SQL query to explain'),
    }),
    handler: async (input: { query: string }): Promise<ToolResponse> => {
      const result = await service.explainQuery(input.query);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
    group: 'extended',
  };
}
