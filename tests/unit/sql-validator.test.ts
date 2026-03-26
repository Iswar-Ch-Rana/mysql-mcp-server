import { describe, it, expect } from 'vitest';
import {
  isReadOnlyStatement,
  containsDangerousPatterns,
  hasMultipleStatements,
  stripStringLiterals,
} from '../../src/domain/validators/sql.validator.js';

describe('isReadOnlyStatement', () => {
  it.each([
    ['SELECT * FROM users', true],
    ['select * from users', true],
    ['SHOW TABLES', true],
    ['show databases', true],
    ['DESCRIBE users', true],
    ['DESC users', true],
    ['EXPLAIN SELECT * FROM users', true],
    ['USE mydb', true],
  ])('should allow: %s', (sql, expected) => {
    expect(isReadOnlyStatement(sql)).toBe(expected);
  });

  it.each([
    ['INSERT INTO users VALUES (1)', false],
    ['UPDATE users SET name = "x"', false],
    ['DELETE FROM users', false],
    ['DROP TABLE users', false],
    ['ALTER TABLE users ADD col INT', false],
    ['CREATE TABLE test (id INT)', false],
    ['TRUNCATE TABLE users', false],
    ['GRANT ALL ON *.* TO root', false],
  ])('should block: %s', (sql, expected) => {
    expect(isReadOnlyStatement(sql)).toBe(expected);
  });
});

describe('containsDangerousPatterns', () => {
  it.each([
    ['SELECT SLEEP(5)', 'SLEEP'],
    ['SELECT BENCHMARK(1000, SHA1("x"))', 'BENCHMARK'],
    ['SELECT LOAD_FILE("/etc/passwd")', 'LOAD_FILE'],
    ['SELECT * INTO OUTFILE "/tmp/x"', 'INTO OUTFILE'],
    ['SELECT * INTO DUMPFILE "/tmp/x"', 'INTO DUMPFILE'],
    ['GRANT ALL ON *.* TO root', 'GRANT'],
    ['REVOKE ALL ON *.* FROM root', 'REVOKE'],
    ['FLUSH PRIVILEGES', 'FLUSH'],
    ['SHUTDOWN', 'SHUTDOWN'],
    ['KILL 123', 'KILL'],
  ])('should detect: %s → %s', (sql, expected) => {
    expect(containsDangerousPatterns(sql)).toBe(expected);
  });

  it('should return null for safe queries', () => {
    expect(containsDangerousPatterns('SELECT * FROM users')).toBeNull();
    expect(containsDangerousPatterns('SHOW TABLES')).toBeNull();
  });

  it('should not flag sleep in string literals', () => {
    expect(containsDangerousPatterns("SELECT 'sleep(5)'")).toBeNull();
  });
});

describe('hasMultipleStatements', () => {
  it('should block multiple statements', () => {
    expect(hasMultipleStatements('SELECT 1; DROP TABLE x')).toBe(true);
  });

  it('should allow trailing semicolon', () => {
    expect(hasMultipleStatements('SELECT 1;')).toBe(false);
  });

  it('should allow no semicolon', () => {
    expect(hasMultipleStatements('SELECT 1')).toBe(false);
  });
});

describe('stripStringLiterals', () => {
  it('should strip single-quoted strings', () => {
    const result = stripStringLiterals("SELECT 'hello world'");
    expect(result).not.toContain('hello world');
  });

  it('should strip double-quoted strings', () => {
    const result = stripStringLiterals('SELECT "hello world"');
    expect(result).not.toContain('hello world');
  });

  it('should preserve length', () => {
    const sql = "SELECT 'hi' FROM t";
    expect(stripStringLiterals(sql).length).toBe(sql.length);
  });
});
