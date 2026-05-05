import { describe, it, expect } from 'vitest';
import { RegexSqlValidator } from '../../src/infrastructure/security/regex-sql-validator.js';

describe('RegexSqlValidator', () => {
  const validator = new RegexSqlValidator();

  describe('allowed statements', () => {
    it.each([
      'SELECT * FROM users',
      'SELECT id FROM users WHERE name = "test"',
      'SHOW TABLES',
      'DESCRIBE users',
    ])('should allow: %s', (sql) => {
      expect(validator.validate(sql).isValid).toBe(true);
    });
  });

  describe('multi-statement queries', () => {
    it('should block stacked queries', () => {
      const result = validator.validate('SELECT 1; DROP TABLE users');
      expect(result.isValid).toBe(false);
    });
  });

  describe('comments', () => {
    // Line comments (--) are stripped before validation so the remaining SQL
    // is evaluated cleanly. They're safe because the stacked-query check runs
    // after stripping, so `; DROP TABLE` hidden behind -- is never seen.
    it('should allow -- trailing line comments', () => {
      const result = validator.validate('SELECT 1 -- this is a comment');
      expect(result.isValid).toBe(true);
    });

    // Block comments are preserved (optimizer hints like /*+ NO_MERGE */ live
    // here). A block comment with no dangerous content is harmless.
    it('should allow /* */ block comments with harmless content', () => {
      const result = validator.validate('SELECT /* optimizer hint */ 1');
      expect(result.isValid).toBe(true);
    });

    // A block comment that contains a semicolon still triggers the
    // stacked-query check because block comments are NOT stripped.
    it('should block block comments that hide a stacked query', () => {
      const result = validator.validate('SELECT 1 /* ; DROP TABLE users */');
      expect(result.isValid).toBe(false);
    });
  });

  describe('write statements', () => {
    it.each([
      'INSERT INTO users VALUES (1)',
      'UPDATE users SET name = "x"',
      'DELETE FROM users',
      'DROP TABLE users',
    ])('should block: %s', (sql) => {
      expect(validator.validate(sql).isValid).toBe(false);
    });
  });

  describe('safe queries with keywords in strings', () => {
    it('should allow SELECT with quoted string containing blocked keywords', () => {
      const result = validator.validate("SELECT * FROM users WHERE name = 'drop'");
      expect(result.isValid).toBe(true);
    });
  });
});
