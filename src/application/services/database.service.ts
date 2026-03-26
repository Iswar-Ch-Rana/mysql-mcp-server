import type { IDatabaseRepository } from '../../domain/interfaces/database.repository.js';
import type { ILogger } from '../../domain/interfaces/logger.js';
import type {
  DatabaseInfo,
  SizeInfo,
  ServerInfo,
  StatusVariable,
  ConfigVariable,
} from '../../domain/entities.js';

export class DatabaseService {
  constructor(
    private readonly repo: IDatabaseRepository,
    private readonly logger: ILogger,
  ) { }

  async listDatabases(): Promise<DatabaseInfo[]> {
    this.logger.debug('Listing databases');
    try {
      return await this.repo.listDatabases();
    } catch (err) {
      this.logger.error('Failed to list databases', { error: (err as Error).message });
      throw err;
    }
  }

  async databaseSize(database?: string): Promise<SizeInfo[]> {
    this.logger.debug('Getting database size', { database });
    try {
      return await this.repo.databaseSize(database);
    } catch (err) {
      this.logger.error('Failed to get database size', { error: (err as Error).message });
      throw err;
    }
  }

  async ping(): Promise<number> {
    this.logger.debug('Pinging database');
    try {
      return await this.repo.ping();
    } catch (err) {
      this.logger.error('Failed to ping database', { error: (err as Error).message });
      throw err;
    }
  }

  async serverInfo(): Promise<ServerInfo> {
    this.logger.debug('Getting server info');
    try {
      return await this.repo.serverInfo();
    } catch (err) {
      this.logger.error('Failed to get server info', { error: (err as Error).message });
      throw err;
    }
  }

  async listStatus(filter?: string): Promise<StatusVariable[]> {
    this.logger.debug('Listing status variables', { filter });
    try {
      return await this.repo.listStatus(filter);
    } catch (err) {
      this.logger.error('Failed to list status variables', { error: (err as Error).message });
      throw err;
    }
  }

  async listVariables(filter?: string): Promise<ConfigVariable[]> {
    this.logger.debug('Listing config variables', { filter });
    try {
      return await this.repo.listVariables(filter);
    } catch (err) {
      this.logger.error('Failed to list config variables', { error: (err as Error).message });
      throw err;
    }
  }
}
