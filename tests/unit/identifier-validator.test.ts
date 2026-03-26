import { describe, it, expect } from 'vitest';
import {
  isValidIdentifier,
  quoteIdentifier,
} from '../../src/domain/validators/identifier.validator.js';

describe('isValidIdentifier', () => {
  it.each([
    'users',
    'my_table',
    'Schema.Table',
    'table-name',
    'Table123',
  ])('should accept valid identifier: %s', (name) => {
    expect(isValidIdentifier(name)).toBe(true);
  });

  it('should reject empty string', () => {
    expect(isValidIdentifier('')).toBe(false);
  });

  it('should reject backtick injection', () => {
    expect(isValidIdentifier('my`table')).toBe(false);
  });

  it('should reject semicolons', () => {
    expect(isValidIdentifier('table;drop')).toBe(false);
  });

  it('should reject comment sequences', () => {
    expect(isValidIdentifier('table--drop')).toBe(false);
    expect(isValidIdentifier('table/*drop')).toBe(false);
  });

  it('should reject names longer than 64 chars', () => {
    expect(isValidIdentifier('a'.repeat(65))).toBe(false);
  });

  it('should accept names up to 64 chars', () => {
    expect(isValidIdentifier('a'.repeat(64))).toBe(true);
  });
});

describe('quoteIdentifier', () => {
  it('should wrap normal identifier in backticks', () => {
    expect(quoteIdentifier('users')).toBe('`users`');
  });

  it('should throw on invalid input', () => {
    expect(() => quoteIdentifier('')).toThrow('Invalid identifier');
    expect(() => quoteIdentifier('table;drop')).toThrow('Invalid identifier');
  });
});
