import { z } from 'zod';
import type { QueryService } from '../../application/services/query.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';
import { buildExplainResult } from '../../domain/validators/explain.parser.js';

const FORMATS = ['default', 'analyze', 'tree', 'json'] as const;

export function createExplainQueryTool(service: QueryService): ToolDefinition {
  return {
    name: 'explain_query',
    description:
      'Show the execution plan for a SQL query. ' +
      'format=analyze runs the query and reports actual timings + the parsed hottest node.',
    inputSchema: z.object({
      query: z.string().describe('SQL query to explain'),
      format: z.enum(FORMATS).optional().describe('default | analyze | tree | json'),
    }),
    handler: async (input: { query: string; format?: typeof FORMATS[number] }): Promise<ToolResponse> => {
      const format = input.format ?? 'default';
      const raw = await service.explainQuery(input.query, format);
      const result = buildExplainResult(raw, format);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
    group: 'extended',
  };
}
