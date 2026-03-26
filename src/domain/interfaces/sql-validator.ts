export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface ISqlValidator {
  validate(sql: string): ValidationResult;
}
