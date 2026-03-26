import { z } from 'zod';
import type { DatabaseService } from '../../application/services/database.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createServerInfoTool(service: DatabaseService): ToolDefinition {
  return {
    name: 'server_info',
    description: 'Get MySQL server information (version, uptime, current user, etc.)',
    inputSchema: z.object({}),
    handler: async (): Promise<ToolResponse> => {
      const info = await service.serverInfo();
      return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
    },
    group: 'core',
  };
}
