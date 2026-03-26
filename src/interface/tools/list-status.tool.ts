import { z } from 'zod';
import type { DatabaseService } from '../../application/services/database.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createListStatusTool(service: DatabaseService): ToolDefinition {
  return {
    name: 'list_status',
    description: 'List MySQL server status variables',
    inputSchema: z.object({
      filter: z.string().optional().describe('Filter pattern for status variables'),
    }),
    handler: async (input: { filter?: string }): Promise<ToolResponse> => {
      const status = await service.listStatus(input.filter);
      return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
    },
    group: 'extended',
  };
}
