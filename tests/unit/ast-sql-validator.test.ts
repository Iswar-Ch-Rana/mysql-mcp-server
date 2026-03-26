import { describe, it, expect } from 'vitest';
import { AstSqlValidator } from '../../src/infrastructure/security/ast-sql-validator.js';

describe('AstSqlValidator', () => {
  const validator = new AstSqlValidator();

  describe('allowed statements', () => {
    it.each([
      'SELECT * FROM users',
      'SELECT id, name FROM users WHERE id = 1',
      'SHOW TABLES',
      'SHOW DATABASES',
      'DESCRIBE users',
      'EXPLAIN SELECT * FROM users',
    ])('should allow: %s', (sql) => {
      expect(validator.validate(sql).isValid).toBe(true);
    });
  });

  describe('blocked statements', () => {
    it.each([
      'INSERT INTO users VALUES (1, "test")',
      'UPDATE users SET name = "x"',
      'DELETE FROM users',
      'DROP TABLE users',
      'ALTER TABLE users ADD col INT',
      'CREATE TABLE test (id INT)',
    ])('should block: %s', (sql) => {
      const result = validator.validate(sql);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe('dangerous functions', () => {
    it.each([
      'SELECT SLEEP(5)',
      'SELECT BENCHMARK(1000, SHA1("x"))',
    ])('should block dangerous function: %s', (sql) => {
      const result = validator.validate(sql);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Dangerous function');
    });
  });

  it('should handle parse errors gracefully', () => {
    const result = validator.validate('NOT VALID SQL AT ALL %%% ^^^');
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('parse error');
  });
});
