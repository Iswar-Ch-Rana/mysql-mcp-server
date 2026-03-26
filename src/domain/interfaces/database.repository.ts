import type {
  DatabaseInfo,
  SizeInfo,
  ServerInfo,
  StatusVariable,
  ConfigVariable,
} from '../entities.js';

export interface IDatabaseRepository {
  listDatabases(): Promise<DatabaseInfo[]>;
  databaseSize(database?: string): Promise<SizeInfo[]>;
  ping(): Promise<number>;
  serverInfo(): Promise<ServerInfo>;
  listStatus(filter?: string): Promise<StatusVariable[]>;
  listVariables(filter?: string): Promise<ConfigVariable[]>;
}
