import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createListSchemasTool(service: SchemaService): ToolDefinition {
  return {
    name: 'list_schemas',
    description: 'List all schemas/databases with metadata',
    inputSchema: z.object({
      filter: z.string().optional().describe('Filter pattern'),
    }),
    handler: async (input: { filter?: string }): Promise<ToolResponse> => {
      const schemas = await service.listSchemas(input.filter);
      return { content: [{ type: 'text', text: JSON.stringify(schemas, null, 2) }] };
    },
    group: 'schema',
  };
}
