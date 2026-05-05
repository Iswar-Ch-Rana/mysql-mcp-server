import { z } from 'zod';
import type { QueryService } from '../../application/services/query.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createRunQueryTool(service: QueryService): ToolDefinition {
  return {
    name: 'run_query',
    description: 'Run a read-only SQL query: SELECT, SHOW, DESCRIBE, EXPLAIN (incl. ANALYZE / FORMAT=TREE|JSON), USE, WITH.',
    inputSchema: z.object({
      query: z.string().describe('SQL SELECT/SHOW/DESCRIBE/EXPLAIN query'),
      schema: z.string().optional().describe('Schema context'),
      max_rows: z.number().optional().describe('Max rows to return'),
    }),
    handler: async (input: { query: string; schema?: string; max_rows?: number }): Promise<ToolResponse> => {
      const result = await service.runQuery(input.query, input.schema, input.max_rows);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
    group: 'core',
  };
}
