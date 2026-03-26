export function stripStringLiterals(sql: string): string {
  return sql.replace(/'[^']*'/g, (match) => ' '.repeat(match.length))
    .replace(/"[^"]*"/g, (match) => ' '.repeat(match.length));
}

export function isReadOnlyStatement(sql: string): boolean {
  const normalized = sql.trim().replace(/\s+/g, ' ').toLowerCase();
  const firstWord = normalized.split(' ')[0];
  const allowed = ['select', 'show', 'describe', 'desc', 'explain', 'use'];
  return allowed.includes(firstWord);
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
