import type { ISqlValidator, ValidationResult } from '../../domain/interfaces/sql-validator.js';
import {
  isReadOnlyStatement,
  hasMultipleStatements,
  containsDangerousPatterns,
  stripStringLiterals,
  stripLineComments,
} from '../../domain/validators/sql.validator.js';

export class RegexSqlValidator implements ISqlValidator {
  validate(sql: string): ValidationResult {
    if (!isReadOnlyStatement(sql)) {
      return {
        isValid: false,
        reason: 'Only read-only statements are allowed (SELECT, SHOW, DESCRIBE, DESC, EXPLAIN, USE, WITH)',
      };
    }

    if (hasMultipleStatements(sql)) {
      return { isValid: false, reason: 'Multiple statements are not allowed' };
    }

    const dangerousPattern = containsDangerousPatterns(sql);
    if (dangerousPattern) {
      return { isValid: false, reason: `Dangerous pattern detected: ${dangerousPattern}` };
    }

    // Strip line comments and string literals so subsequent regex checks don't
    // get fooled by tokens that appear inside comments or quoted text.
    const stripped = stripStringLiterals(stripLineComments(sql)).toLowerCase();

    // Block UNION + information_schema probing
    if (/\bunion\b/.test(stripped) && /\bselect\b.*\bfrom\b.*\binformation_schema\b/.test(stripped)) {
      return { isValid: false, reason: 'UNION with information_schema access is not allowed' };
    }

    // Block stacked queries via semicolon (after string-literal stripping so
    // that `;` inside a string doesn't trigger this).
    if (/;/.test(stripped.replace(/;\s*$/, ''))) {
      return { isValid: false, reason: 'Stacked queries are not allowed' };
    }

    return { isValid: true };
  }
}
