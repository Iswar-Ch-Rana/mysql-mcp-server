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

  describe('comment injection', () => {
    it('should block -- comments', () => {
      const result = validator.validate('SELECT 1 -- this is a comment');
      expect(result.isValid).toBe(false);
    });

    it('should block /* */ comments', () => {
      const result = validator.validate('SELECT /* hidden */ 1');
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
