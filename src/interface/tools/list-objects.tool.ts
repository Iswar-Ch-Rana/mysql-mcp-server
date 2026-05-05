import { z } from 'zod';
import type { SchemaService } from '../../application/services/schema.service.js';
import type { DatabaseService } from '../../application/services/database.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

const KINDS = ['view', 'trigger', 'function', 'partition', 'status', 'variable'] as const;
type Kind = typeof KINDS[number];

/**
 * Single tool that replaces six near-identical list_* tools. The LLM picks
 * the kind via a parameter rather than scanning six tool descriptions.
 *
 * - view, trigger, function: require schema
 * - partition:               requires schema + table
 * - status, variable:        global, optional filter (LIKE pattern)
 */
export function createListObjectsTool(
  schemaService: SchemaService,
  databaseService: DatabaseService,
): ToolDefinition {
  return {
    name: 'list_objects',
    description:
      "List server objects by kind: 'view'|'trigger'|'function' (need schema), 'partition' (need schema+table), 'status'|'variable' (global; optional filter).",
    inputSchema: z.object({
      kind: z.enum(KINDS).describe("'view' | 'trigger' | 'function' | 'partition' | 'status' | 'variable'"),
      schema: z.string().optional().describe('Schema/database name (required for view, trigger, function, partition)'),
      table: z.string().optional().describe('Table name (required for partition)'),
      filter: z.string().optional().describe('LIKE pattern for status/variable'),
    }),
    handler: async (input: {
      kind: Kind;
      schema?: string;
      table?: string;
      filter?: string;
    }): Promise<ToolResponse> => {
      const requireSchema = (): string => {
        if (!input.schema) throw new Error(`schema is required for kind=${input.kind}`);
        return input.schema;
      };

      let payload: unknown;
      switch (input.kind) {
        case 'view':
          payload = await schemaService.listViews(requireSchema());
          break;
        case 'trigger':
          payload = await schemaService.listTriggers(requireSchema());
          break;
        case 'function':
          payload = await schemaService.listFunctions(requireSchema());
          break;
        case 'partition': {
          const sch = requireSchema();
          if (!input.table) throw new Error('table is required for kind=partition');
          payload = await schemaService.listPartitions(sch, input.table);
          break;
        }
        case 'status':
          payload = await databaseService.listStatus(input.filter);
          break;
        case 'variable':
          payload = await databaseService.listVariables(input.filter);
          break;
      }
      return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
    },
    group: 'extended',
  };
}
