import { z } from 'zod';
import type { IndexHealthService } from '../../application/services/index-health.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createIndexHealthTool(service: IndexHealthService): ToolDefinition {
  return {
    name: 'index_health',
    description:
      'Find unused indexes (sys.schema_unused_indexes) and prefix-superset redundancies. Pass schema for cheap mode; add table to limit redundancy walk to one table.',
    inputSchema: z.object({
      schema: z.string().optional().describe('Limit to one schema'),
      table: z.string().optional().describe('Limit redundancy detection to one table (requires schema)'),
    }),
    handler: async (input: { schema?: string; table?: string }): Promise<ToolResponse> => {
      const report = await service.report(input.schema, input.table);
      return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };
    },
    group: 'extended',
  };
}
