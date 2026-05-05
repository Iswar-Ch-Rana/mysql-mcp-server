import type { ISchemaRepository } from '../../domain/interfaces/schema.repository.js';
import type { IQueryRepository } from '../../domain/interfaces/query.repository.js';
import type { IndexHealthReport, RedundantIndex, IndexInfo } from '../../domain/entities.js';

interface IndexEntry {
  name: string;
  columns: string[];
  unique: boolean;
}

/**
 * Returns true if `prefix` is a strict prefix-or-equal of `full` — meaning
 * `full` covers everything `prefix` does for leftmost-prefix lookups, and
 * `prefix` is therefore redundant.
 */
function isPrefixOf(prefix: string[], full: string[]): boolean {
  if (prefix.length > full.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i].toLowerCase() !== full[i].toLowerCase()) return false;
  }
  return true;
}

function detectRedundantInTable(schema: string, table: string, indexes: IndexInfo[]): RedundantIndex[] {
  const findings: RedundantIndex[] = [];
  const candidates: IndexEntry[] = indexes
    .filter((i) => i.name !== 'PRIMARY' && i.type !== 'FULLTEXT' && i.type !== 'SPATIAL')
    .map((i) => ({ name: i.name, columns: i.columns, unique: i.unique }));

  for (const a of candidates) {
    for (const b of candidates) {
      if (a.name === b.name) continue;
      // a is redundant if b is a superset prefix of a and b carries at least
      // as much uniqueness guarantee.
      if (isPrefixOf(a.columns, b.columns) && a.columns.length < b.columns.length) {
        // If `a` is unique we can't drop it just because `b` is a longer index;
        // uniqueness is enforced on the leading columns of `a`, and `b` would
        // only enforce uniqueness on its full column set.
        if (a.unique && !b.unique) continue;
        findings.push({
          schema,
          table,
          redundantIndex: a.name,
          supersededBy: b.name,
          reason: `(${a.columns.join(', ')}) is a leftmost-prefix of (${b.columns.join(', ')})`,
        });
        break;
      }
    }
  }
  return findings;
}

export class IndexHealthService {
  constructor(
    private readonly schemaRepo: ISchemaRepository,
    private readonly queryRepo: IQueryRepository,
  ) { }

  /**
   * Return unused indexes (sys.schema_unused_indexes) and indexes that are
   * a strict leftmost-prefix of another index in the same table (redundant).
   *
   * If `table` is provided, redundancy detection is limited to that one
   * table; otherwise it walks every table in `schema`.
   */
  async report(schema?: string, table?: string): Promise<IndexHealthReport> {
    const unused = await this.queryRepo.unusedIndexes(schema);

    const redundant: RedundantIndex[] = [];
    if (schema && table) {
      const indexes = await this.schemaRepo.listIndexes(schema, table);
      redundant.push(...detectRedundantInTable(schema, table, indexes));
    } else if (schema) {
      const tables = await this.schemaRepo.listTables(schema);
      for (const t of tables) {
        if (t.type !== 'TABLE') continue;
        const indexes = await this.schemaRepo.listIndexes(schema, t.name);
        redundant.push(...detectRedundantInTable(schema, t.name, indexes));
      }
    }
    // If no schema given, skip the per-table redundancy walk — too expensive
    // by default. The caller can re-run with schema filled in.

    return { unused, redundant };
  }
}
