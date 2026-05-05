import { z } from 'zod';
import type { QueryService } from '../../application/services/query.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createTopSlowQueriesTool(service: QueryService): ToolDefinition {
  return {
    name: 'top_slow_queries',
    description:
      'Top N slowest query patterns from performance_schema.events_statements_summary_by_digest, ranked by total time.',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(100).optional().describe('Number of rows (default 10)'),
      schema: z.string().optional().describe('Filter to one schema'),
    }),
    handler: async (input: { limit?: number; schema?: string }): Promise<ToolResponse> => {
      const rows = await service.topSlowQueries(input.limit ?? 10, input.schema);
      return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
    },
    group: 'extended',
  };
}
