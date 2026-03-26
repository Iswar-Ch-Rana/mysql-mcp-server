import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createListViewsTool(service: SchemaService): ToolDefinition {
  return {
    name: 'list_views',
    description: 'List all views in a schema',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name'),
    }),
    handler: async (input: { schema: string }): Promise<ToolResponse> => {
      const views = await service.listViews(input.schema);
      return { content: [{ type: 'text', text: JSON.stringify(views, null, 2) }] };
    },
    group: 'extended',
  };
}
