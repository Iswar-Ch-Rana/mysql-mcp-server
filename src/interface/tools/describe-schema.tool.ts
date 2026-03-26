import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

export function createDescribeSchemaTool(service: SchemaService): ToolDefinition {
  return {
    name: 'describe_schema',
    description: 'Get a comprehensive overview of a schema (tables, views, procedures, functions)',
    inputSchema: z.object({
      schema: z.string().describe('Schema/database name'),
    }),
    handler: async (input: { schema: string }): Promise<ToolResponse> => {
      const [tables, views, procedures, functions] = await Promise.all([
        service.listTables(input.schema),
        service.listViews(input.schema),
        service.listProcedures(input.schema),
        service.listFunctions(input.schema),
      ]);
      const summary = { schema: input.schema, tables, views, procedures, functions };
      return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
    },
    group: 'schema',
  };
}
