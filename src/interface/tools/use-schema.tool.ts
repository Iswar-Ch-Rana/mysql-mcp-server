import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createUseSchemaTool(service: SchemaService): ToolDefinition {
  return {
    name: 'use_schema',
    description: 'Switch the active schema/database context',
    inputSchema: z.object({
      schema: z.string().describe('Schema name to switch to'),
    }),
    handler: async (input: { schema: string }): Promise<ToolResponse> => {
      await service.switchSchema(input.schema);
      return { content: [{ type: 'text', text: `Switched to schema: ${input.schema}` }] };
    },
    group: 'schema',
  };
}
