import type { ExplainBottleneck, QueryResult, ExplainResult } from '../entities.js';

const ANALYZE_RE = /actual time=(?<first>[\d.]+)\.\.(?<last>[\d.]+)\s+rows=(?<rows>[\d.]+)\s+loops=(?<loops>\d+)/;
const OP_RE = /^->\s*(?<op>[^\s(]+(?:\s+[^(\s]+)*)/;
const WARNING_FLAGS = ['Using temporary', 'Using filesort', 'Using where', 'Using join buffer', 'Using index for skip scan'];

/**
 * Parse the text output of `EXPLAIN ANALYZE` (FORMAT=TREE) and return the
 * single hottest node by `actual time × loops`. Also surfaces notable plan
 * flags ("Using temporary", "Using filesort", etc.).
 *
 * The tree text comes back from MySQL as one big string in a single column —
 * we walk it line by line.
 */
export function parseExplainTree(tree: string): { hottest: ExplainBottleneck | null; warnings: string[] } {
  if (!tree) return { hottest: null, warnings: [] };

  const warnings = new Set<string>();
  let hottest: ExplainBottleneck | null = null;

  for (const rawLine of tree.split('\n')) {
    const line = rawLine.trimEnd();

    for (const flag of WARNING_FLAGS) {
      if (line.includes(flag)) warnings.add(flag);
    }

    const m = line.match(ANALYZE_RE);
    if (!m || !m.groups) continue;

    const last = Number(m.groups.last);
    const loops = Number(m.groups.loops);
    if (!Number.isFinite(last) || !Number.isFinite(loops)) continue;

    const opMatch = line.trimStart().match(OP_RE);
    const op = opMatch?.groups?.op?.trim() ?? '(unknown)';

    // Per-iteration time is approximately last / loops, but the more
    // meaningful "total time at this node" is just `last` because EXPLAIN
    // ANALYZE accumulates child time into the parent's `last`.
    const totalMs = last;
    const perIterationUs = loops > 0 ? (last * 1000) / loops : null;

    if (!hottest || totalMs > (hottest.actualTimeMs ?? -1)) {
      hottest = {
        operation: op,
        actualTimeMs: totalMs,
        loops,
        perIterationUs,
      };
    }
  }

  return { hottest, warnings: Array.from(warnings) };
}

/**
 * Build the public-facing ExplainResult shape from a raw QueryResult.
 * For 'analyze' format the rows contain a single column whose value is the
 * tree text; we parse that for the hottest node + warnings.
 */
export function buildExplainResult(
  raw: QueryResult,
  format: 'default' | 'analyze' | 'tree' | 'json',
): ExplainResult {
  if (format !== 'analyze' && format !== 'tree') {
    return { format, raw, hottest: null, warnings: [] };
  }
  const firstRow = raw.rows[0];
  if (!firstRow) return { format, raw, hottest: null, warnings: [] };
  // The single column from EXPLAIN ANALYZE / FORMAT=TREE is named "EXPLAIN".
  const tree = String(Object.values(firstRow)[0] ?? '');
  const { hottest, warnings } = parseExplainTree(tree);
  return { format, raw, hottest, warnings };
}
