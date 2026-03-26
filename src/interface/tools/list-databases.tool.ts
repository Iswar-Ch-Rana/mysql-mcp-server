import { z } from 'zod';
import type { DatabaseService } from '../../application/services/database.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createListDatabasesTool(service: DatabaseService): ToolDefinition {
  return {
    name: 'list_databases',
    description: 'List all accessible databases/schemas on the MySQL server',
    inputSchema: z.object({}),
    handler: async (): Promise<ToolResponse> => {
      const databases = await service.listDatabases();
      return { content: [{ type: 'text', text: JSON.stringify(databases, null, 2) }] };
    },
    group: 'core',
  };
}
