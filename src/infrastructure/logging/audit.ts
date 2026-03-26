import { appendFileSync } from 'node:fs';
import type { IAuditLogger } from '../../domain/interfaces/logger.js';
import type { AuditEntry } from '../../domain/entities.js';

export class FileAuditLogger implements IAuditLogger {
  constructor(private readonly filePath?: string) { }

  logQuery(entry: AuditEntry): void {
    if (!this.filePath) {
      return;
    }

    const line = JSON.stringify({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    });

    appendFileSync(this.filePath, line + '\n', 'utf-8');
  }
}
