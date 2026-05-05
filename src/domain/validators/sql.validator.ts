export function stripStringLiterals(sql: string): string {
  return sql.replace(/'[^']*'/g, (match) => ' '.repeat(match.length))
    .replace(/"[^"]*"/g, (match) => ' '.repeat(match.length));
}

export function isReadOnlyStatement(sql: string): boolean {
  const normalized = stripLineComments(sql).trim().replace(/\s+/g, ' ').toLowerCase();
  const firstWord = normalized.split(' ')[0];
  const allowed = ['select', 'show', 'describe', 'desc', 'explain', 'use', 'with'];
  return allowed.includes(firstWord);
}

/**
 * Strip a leading `EXPLAIN [ANALYZE] [FORMAT=…]` prefix and return the inner
 * statement. Useful so downstream parsers (e.g. node-sql-parser) only see the
 * inner SELECT, since they don't understand MySQL's EXPLAIN extensions.
 *
 * Returns the original SQL unchanged if no EXPLAIN prefix is present.
 */
export function stripExplainPrefix(sql: string): string {
  const trimmed = sql.replace(/^\s+/, '');
  // Match: EXPLAIN [ANALYZE] [FORMAT=(TREE|JSON|TRADITIONAL)]
  // Followed by optional whitespace before the inner statement.
  const re = /^explain\b(?:\s+analyze\b)?(?:\s+format\s*=\s*(?:tree|json|traditional)\b)?\s*/i;
  const m = trimmed.match(re);
  if (!m) return sql;
  return trimmed.slice(m[0].length);
}

/**
 * Remove leading `-- ...` line comments to end of line.
 *
 * Block comments are preserved since they may carry MySQL optimizer hints.
 */
export function stripLineComments(sql: string): string {
  // Strip from `--` (preceded by whitespace or start) to end-of-line.
  return sql.replace(/(^|\s)--[^\n]*/g, '$1');
}

export function containsDangerousPatterns(sql: string): string | null {
  const stripped = stripStringLiterals(sql).toLowerCase();

  const patterns: [RegExp, string][] = [
    [/\bload_file\b/i, 'LOAD_FILE'],
    [/\binto\s+outfile\b/i, 'INTO OUTFILE'],
    [/\binto\s+dumpfile\b/i, 'INTO DUMPFILE'],
    [/\bgrant\b/i, 'GRANT'],
    [/\brevoke\b/i, 'REVOKE'],
    [/\bflush\b/i, 'FLUSH'],
    [/\breset\b/i, 'RESET'],
    [/\bkill\b/i, 'KILL'],
    [/\bshutdown\b/i, 'SHUTDOWN'],
    [/\bsleep\s*\(/i, 'SLEEP'],
    [/\bbenchmark\s*\(/i, 'BENCHMARK'],
    [/\bsys_exec\s*\(/i, 'SYS_EXEC'],
  ];

  for (const [pattern, name] of patterns) {
    if (pattern.test(stripped)) {
      return name;
    }
  }

  return null;
}

export function hasMultipleStatements(sql: string): boolean {
  const stripped = stripStringLiterals(sql).trim();
  // Remove trailing semicolons and whitespace
  const withoutTrailing = stripped.replace(/;\s*$/, '');
  return withoutTrailing.includes(';');
}
