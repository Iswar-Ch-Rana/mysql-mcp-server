import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createSchemaSearchTool(service: SchemaService): ToolDefinition {
  return {
    name: 'schema_search',
    description: 'Search for database objects by name across schemas',
    inputSchema: z.object({
      name: z.string().describe('Object name to search for'),
      type: z.enum(['table', 'view', 'procedure', 'function']).optional().describe('Object type filter'),
    }),
    handler: async (input: { name: string; type?: 'table' | 'view' | 'procedure' | 'function' }): Promise<ToolResponse> => {
      const results = await service.searchObjects(input.name, input.type);
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    },
    group: 'schema',
  };
}
