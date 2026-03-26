import { z } from 'zod';
import type { ConnectionService } from '../../application/services/connection.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createUseConnectionTool(service: ConnectionService): ToolDefinition {
  return {
    name: 'use_connection',
    description: 'Switch to a different database connection',
    inputSchema: z.object({
      name: z.string().describe('Connection name'),
    }),
    handler: async (input: { name: string }): Promise<ToolResponse> => {
      await service.useConnection(input.name);
      return { content: [{ type: 'text', text: `Switched to connection: ${input.name}` }] };
    },
    group: 'connection',
  };
}
