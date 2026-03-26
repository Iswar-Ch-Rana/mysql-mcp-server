import { z } from 'zod';
import type { DatabaseService } from '../../application/services/database.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createDatabaseSizeTool(service: DatabaseService): ToolDefinition {
  return {
    name: 'database_size',
    description: 'Get the size of a database or all databases',
    inputSchema: z.object({
      database: z.string().optional().describe('Database name (omit for all)'),
    }),
    handler: async (input: { database?: string }): Promise<ToolResponse> => {
      const sizes = await service.databaseSize(input.database);
      return { content: [{ type: 'text', text: JSON.stringify(sizes, null, 2) }] };
    },
    group: 'extended',
  };
}
