import type { ISqlValidator, ValidationResult } from '../../domain/interfaces/sql-validator.js';

export class CompositeSqlValidator implements ISqlValidator {
  constructor(private readonly validators: ISqlValidator[]) { }

  validate(sql: string): ValidationResult {
    for (const validator of this.validators) {
      const result = validator.validate(sql);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  }
}
