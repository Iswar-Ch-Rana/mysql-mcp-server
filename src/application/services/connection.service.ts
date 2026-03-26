import type { ILogger } from '../../domain/interfaces/logger.js';
import type { ConnectionInfo } from '../../domain/entities.js';
import type { ConnectionConfig } from '../../shared/config.js';
import { NotFoundError } from '../../domain/errors.js';

export class ConnectionService {
  private activeConnection = 'default';

  constructor(
    private readonly connections: Record<string, ConnectionConfig>,
    private readonly logger: ILogger,
  ) { }

  async listConnections(): Promise<ConnectionInfo[]> {
    return Object.entries(this.connections).map(([name, config]) => {
      let host = '';
      let database = '';
      try {
        const url = new URL(config.dsn);
        host = url.hostname;
        database = url.pathname.length > 1 ? decodeURIComponent(url.pathname.slice(1)) : '';
      } catch {
        host = config.dsn;
      }
      return {
        name,
        host,
        active: name === this.activeConnection,
        activeSchema: database,
      };
    });
  }

  async useConnection(name: string): Promise<void> {
    if (!this.connections[name]) {
      throw new NotFoundError('Connection', name);
    }
    this.activeConnection = name;
    this.logger.info('Switched connection', { connection: name });
  }

  getActiveConnectionName(): string {
    return this.activeConnection;
  }

  getActiveDsn(): string {
    return this.connections[this.activeConnection].dsn;
  }
}
