import { z } from 'zod';
import type { QueryService } from '../../application/services/query.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createProcessListTool(service: QueryService): ToolDefinition {
  return {
    name: 'processlist',
    description:
      'Currently running connections (information_schema.PROCESSLIST). Useful for spotting hung/long-running queries.',
    inputSchema: z.object({
      include_sleep: z.boolean().optional().describe('Include idle connections (default false)'),
    }),
    handler: async (input: { include_sleep?: boolean }): Promise<ToolResponse> => {
      const rows = await service.processList(input.include_sleep ?? false);
      return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
    },
    group: 'extended',
  };
}
