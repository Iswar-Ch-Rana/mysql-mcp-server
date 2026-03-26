import { z } from 'zod';
import type { ConnectionService } from '../../application/services/connection.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createListConnectionsTool(service: ConnectionService): ToolDefinition {
  return {
    name: 'list_connections',
    description: 'List all configured database connections',
    inputSchema: z.object({}),
    handler: async (): Promise<ToolResponse> => {
      const connections = await service.listConnections();
      return { content: [{ type: 'text', text: JSON.stringify(connections, null, 2) }] };
    },
    group: 'connection',
  };
}
