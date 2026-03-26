import type { ISqlValidator, ValidationResult } from '../../domain/interfaces/sql-validator.js';
import {
  isReadOnlyStatement,
  hasMultipleStatements,
  containsDangerousPatterns,
  stripStringLiterals,
} from '../../domain/validators/sql.validator.js';

export class RegexSqlValidator implements ISqlValidator {
  validate(sql: string): ValidationResult {
    if (!isReadOnlyStatement(sql)) {
      return { isValid: false, reason: 'Only read-only statements are allowed (SELECT, SHOW, DESCRIBE, DESC, EXPLAIN, USE)' };
    }

    if (hasMultipleStatements(sql)) {
      return { isValid: false, reason: 'Multiple statements are not allowed' };
    }

    const dangerousPattern = containsDangerousPatterns(sql);
    if (dangerousPattern) {
      return { isValid: false, reason: `Dangerous pattern detected: ${dangerousPattern}` };
    }

    const stripped = stripStringLiterals(sql).toLowerCase();

    // Block UNION + information_schema probing
    if (/\bunion\b/.test(stripped) && /\bselect\b.*\bfrom\b.*\binformation_schema\b/.test(stripped)) {
      return { isValid: false, reason: 'UNION with information_schema access is not allowed' };
    }

    // Block stacked queries via semicolon
    if (/;/.test(stripped.replace(/;\s*$/, ''))) {
      return { isValid: false, reason: 'Stacked queries are not allowed' };
    }

    // Block comment-based injection
    if (/--/.test(stripped) || /\/\*/.test(stripped)) {
      return { isValid: false, reason: 'SQL comments are not allowed' };
    }

    return { isValid: true };
  }
}
