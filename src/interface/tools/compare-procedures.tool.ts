import { z } from 'zod';
import type { QueryService } from '../../application/services/query.service.js';
import type { ToolDefinition, ToolResponse } from './registry.js';

const ROW_SCAN_CAP = 1000;

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function createCompareProceduresTool(service: QueryService): ToolDefinition {
  return {
    name: 'compare_procedures',
    description:
      'Call two stored procedures and compare their result sets without returning full data. ' +
      'Returns a structured diff: overall match flag, row count differences, column differences per result set, ' +
      'a configurable sample of mismatched rows, and a full timing breakdown (diff_ms, ratio, change_pct, faster). ' +
      'Use sequential:true when comparing performance — parallel execution shares DB resources and skews timing.',
    inputSchema: z.object({
      procedure_a: z.object({
        schema: z.string().describe('Schema/database of the first procedure'),
        procedure: z.string().describe('Name of the first procedure'),
        args: z
          .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
          .optional()
          .describe('Ordered IN/INOUT arguments for the first procedure'),
      }),
      procedure_b: z.object({
        schema: z.string().describe('Schema/database of the second procedure'),
        procedure: z.string().describe('Name of the second procedure'),
        args: z
          .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
          .optional()
          .describe('Ordered IN/INOUT arguments for the second procedure'),
      }),
      sample_mismatch_limit: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe('Maximum number of mismatched rows to include per result set (default 5)'),
      sequential: z
        .boolean()
        .optional()
        .describe(
          'Run procedures sequentially instead of in parallel (default false). Use true for accurate timing comparison — parallel execution shares DB resources and skews duration measurements.',
        ),
    }),
    handler: async (input: {
      procedure_a: { schema: string; procedure: string; args?: Array<string | number | boolean | null> };
      procedure_b: { schema: string; procedure: string; args?: Array<string | number | boolean | null> };
      sample_mismatch_limit?: number;
      sequential?: boolean;
    }): Promise<ToolResponse> => {
      const sampleLimit = input.sample_mismatch_limit ?? 5;
      const isSequential = input.sequential ?? false;

      let resultA, resultB;
      if (isSequential) {
        resultA = await service.callProcedure(
          input.procedure_a.schema,
          input.procedure_a.procedure,
          input.procedure_a.args ?? [],
        );
        resultB = await service.callProcedure(
          input.procedure_b.schema,
          input.procedure_b.procedure,
          input.procedure_b.args ?? [],
        );
      } else {
        [resultA, resultB] = await Promise.all([
          service.callProcedure(
            input.procedure_a.schema,
            input.procedure_a.procedure,
            input.procedure_a.args ?? [],
          ),
          service.callProcedure(
            input.procedure_b.schema,
            input.procedure_b.procedure,
            input.procedure_b.args ?? [],
          ),
        ]);
      }

      const countA = resultA.resultSets.length;
      const countB = resultB.resultSets.length;
      const resultSetCountMatch = countA === countB;
      let overallMatch = resultSetCountMatch;

      const resultSets = [];
      const sharedCount = Math.min(countA, countB);

      for (let i = 0; i < sharedCount; i++) {
        const rsA = resultA.resultSets[i];
        const rsB = resultB.resultSets[i];

        const colSetA = new Set(rsA.columns);
        const colSetB = new Set(rsB.columns);
        const onlyInA = rsA.columns.filter((c) => !colSetB.has(c));
        const onlyInB = rsB.columns.filter((c) => !colSetA.has(c));
        const columnsMatch = onlyInA.length === 0 && onlyInB.length === 0;
        const rowCountMatch = rsA.rowCount === rsB.rowCount;
        const rowsScanned = Math.min(rsA.rowCount, rsB.rowCount, ROW_SCAN_CAP);

        let dataMatch: boolean | null = null;
        let totalMismatchedRows = 0;
        const sampleMismatches: {
          rowIndex: number;
          diffs: { column: string; a: unknown; b: unknown }[];
        }[] = [];

        if (columnsMatch && rowsScanned > 0) {
          for (let r = 0; r < rowsScanned; r++) {
            const rowA = rsA.rows[r];
            const rowB = rsB.rows[r];
            const diffs: { column: string; a: unknown; b: unknown }[] = [];
            for (const col of rsA.columns) {
              if (JSON.stringify(rowA[col]) !== JSON.stringify(rowB[col])) {
                diffs.push({ column: col, a: rowA[col], b: rowB[col] });
              }
            }
            if (diffs.length > 0) {
              totalMismatchedRows++;
              if (sampleMismatches.length < sampleLimit) {
                sampleMismatches.push({ rowIndex: r, diffs });
              }
            }
          }
          dataMatch = totalMismatchedRows === 0 && rowCountMatch;
        } else if (columnsMatch) {
          // Both result sets are empty — match only if both have 0 rows
          dataMatch = rowCountMatch;
        }
        // columnsMatch === false → dataMatch stays null (can't meaningfully diff rows)

        if (dataMatch !== true) overallMatch = false;

        resultSets.push({
          index: i,
          rowCount: {
            a: rsA.rowCount,
            b: rsB.rowCount,
            diff: rsB.rowCount - rsA.rowCount,
            match: rowCountMatch,
          },
          columns: {
            a: rsA.columns,
            b: rsB.columns,
            match: columnsMatch,
            onlyInA,
            onlyInB,
          },
          rowsScanned,
          dataMatch,
          totalMismatchedRows,
          sampleMismatches,
        });
      }

      // Build timing comparison
      const diffMs = resultB.durationMs - resultA.durationMs;
      const timing: {
        a_ms: number;
        b_ms: number;
        diff_ms: number;
        ratio: number | null;
        change_pct: number | null;
        faster: 'a' | 'b' | 'equal';
        note?: string;
      } = {
        a_ms: resultA.durationMs,
        b_ms: resultB.durationMs,
        diff_ms: diffMs,
        ratio: resultA.durationMs > 0 ? roundTo(resultB.durationMs / resultA.durationMs, 2) : null,
        change_pct:
          resultA.durationMs > 0 ? roundTo((diffMs / resultA.durationMs) * 100, 1) : null,
        faster: diffMs < 0 ? 'b' : diffMs > 0 ? 'a' : 'equal',
      };
      if (!isSequential) {
        timing.note =
          'Use sequential:true for accurate timing — parallel mode shares DB resources.';
      }

      const output = {
        match: overallMatch,
        executionMode: isSequential ? 'sequential' : 'parallel',
        procedures: {
          a: {
            schema: input.procedure_a.schema,
            procedure: input.procedure_a.procedure,
            args: input.procedure_a.args ?? [],
          },
          b: {
            schema: input.procedure_b.schema,
            procedure: input.procedure_b.procedure,
            args: input.procedure_b.args ?? [],
          },
        },
        timing,
        resultSetCount: {
          a: countA,
          b: countB,
          match: resultSetCountMatch,
        },
        resultSets,
      };

      return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
    },
    group: 'extended',
  };
}
