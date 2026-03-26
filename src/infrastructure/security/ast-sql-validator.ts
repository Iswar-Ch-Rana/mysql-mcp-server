import pkg from 'node-sql-parser';
const { Parser } = pkg;
import type { ISqlValidator, ValidationResult } from '../../domain/interfaces/sql-validator.js';

const ALLOWED_TYPES = new Set(['select', 'show', 'desc', 'explain', 'use']);
const DANGEROUS_FUNCTIONS = new Set(['sleep', 'benchmark', 'load_file', 'sys_exec', 'sys_eval', 'sys_get']);

function walkAst(node: unknown, visitor: (n: Record<string, unknown>) => void): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) {
      walkAst(item, visitor);
    }
    return;
  }
  const obj = node as Record<string, unknown>;
  visitor(obj);
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') {
      walkAst(value, visitor);
    }
  }
}

function extractFunctionName(nameNode: unknown): string | null {
  if (typeof nameNode === 'string') {
    return nameNode.toLowerCase();
  }
  if (nameNode && typeof nameNode === 'object') {
    const obj = nameNode as Record<string, unknown>;
    // node-sql-parser format: { name: [{ type: 'default', value: 'SLEEP' }] }
    if (Array.isArray(obj.name)) {
      for (const part of obj.name) {
        if (part && typeof part === 'object' && 'value' in part) {
          return String(part.value).toLowerCase();
        }
      }
    }
    if (typeof obj.value === 'string') {
      return obj.value.toLowerCase();
    }
  }
  return null;
}

export class AstSqlValidator implements ISqlValidator {
  private readonly parser = new Parser();

  validate(sql: string): ValidationResult {
    let ast: unknown;
    try {
      ast = this.parser.astify(sql, { database: 'MySQL' });
    } catch (err) {
      return { isValid: false, reason: `SQL parse error: ${(err as Error).message}` };
    }

    const nodes = Array.isArray(ast) ? ast : [ast];

    for (const node of nodes) {
      const nodeType = String((node as Record<string, unknown>).type ?? '').toLowerCase();
      if (!ALLOWED_TYPES.has(nodeType)) {
        return { isValid: false, reason: `Statement type '${nodeType}' is not allowed` };
      }

      let dangerousFunc: string | null = null;
      walkAst(node, (n) => {
        if (n.type === 'function' || n.type === 'aggr_func') {
          const name = extractFunctionName(n.name);
          if (name && DANGEROUS_FUNCTIONS.has(name)) {
            dangerousFunc = name;
          }
        }
      });

      if (dangerousFunc) {
        return { isValid: false, reason: `Dangerous function '${dangerousFunc}' is not allowed` };
      }
    }

    return { isValid: true };
  }
}
