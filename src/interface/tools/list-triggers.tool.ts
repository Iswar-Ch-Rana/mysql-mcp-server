import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createListTriggersTool(service: SchemaService): ToolDefinition {
  return {
    name: 'list_triggers',
    description: 'List all triggers in a schema',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name'),
    }),
    handler: async (input: { schema: string }): Promise<ToolResponse> => {
      const triggers = await service.listTriggers(input.schema);
      return { content: [{ type: 'text', text: JSON.stringify(triggers, null, 2) }] };
    },
    group: 'extended',
  };
}
