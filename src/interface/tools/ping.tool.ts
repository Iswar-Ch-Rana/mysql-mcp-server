import { z } from 'zod';
import type { DatabaseService } from '../../application/services/database.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createPingTool(service: DatabaseService): ToolDefinition {
  return {
    name: 'ping',
    description: 'Ping the MySQL server to check connectivity',
    inputSchema: z.object({}),
    handler: async (): Promise<ToolResponse> => {
      const latencyMs = await service.ping();
      return { content: [{ type: 'text', text: JSON.stringify({ latencyMs }, null, 2) }] };
    },
    group: 'core',
  };
}
