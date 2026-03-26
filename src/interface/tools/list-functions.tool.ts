import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createListFunctionsTool(service: SchemaService): ToolDefinition {
  return {
    name: 'list_functions',
    description: 'List all stored functions in a schema',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name'),
    }),
    handler: async (input: { schema: string }): Promise<ToolResponse> => {
      const functions = await service.listFunctions(input.schema);
      return { content: [{ type: 'text', text: JSON.stringify(functions, null, 2) }] };
    },
    group: 'extended',
  };
}
