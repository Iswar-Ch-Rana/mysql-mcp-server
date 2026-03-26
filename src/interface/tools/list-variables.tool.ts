import { z } from 'zod';
import type { DatabaseService } from '../../application/services/database.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createListVariablesTool(service: DatabaseService): ToolDefinition {
  return {
    name: 'list_variables',
    description: 'List MySQL server configuration variables',
    inputSchema: z.object({
      filter: z.string().optional().describe('Filter pattern for variables'),
    }),
    handler: async (input: { filter?: string }): Promise<ToolResponse> => {
      const variables = await service.listVariables(input.filter);
      return { content: [{ type: 'text', text: JSON.stringify(variables, null, 2) }] };
    },
    group: 'extended',
  };
}
