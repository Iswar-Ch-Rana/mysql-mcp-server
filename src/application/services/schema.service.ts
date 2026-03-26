import type { ISchemaRepository } from '../../domain/interfaces/schema.repository.js';
import type { ILogger } from '../../domain/interfaces/logger.js';
import type {
  SchemaInfo,
  TableInfo,
  ColumnInfo,
  IndexInfo,
  ViewInfo,
  TriggerInfo,
  RoutineInfo,
  PartitionInfo,
  ForeignKeyInfo,
  SizeInfo,
  SearchResult,
  ObjectType,
  ProcedureResult,
} from '../../domain/entities.js';

export class SchemaService {
  constructor(
    private readonly repo: ISchemaRepository,
    private readonly logger: ILogger,
  ) { }

  async listSchemas(filter?: string): Promise<SchemaInfo[]> {
    this.logger.debug('Listing schemas', { filter });
    try {
      return await this.repo.listSchemas(filter);
    } catch (err) {
      this.logger.error('Failed to list schemas', { error: (err as Error).message });
      throw err;
    }
  }

  async switchSchema(schema: string): Promise<void> {
    this.logger.debug('Switching schema', { schema });
    try {
      await this.repo.switchSchema(schema);
    } catch (err) {
      this.logger.error('Failed to switch schema', { error: (err as Error).message });
      throw err;
    }
  }

  async listTables(schema: string): Promise<TableInfo[]> {
    this.logger.debug('Listing tables', { schema });
    try {
      return await this.repo.listTables(schema);
    } catch (err) {
      this.logger.error('Failed to list tables', { error: (err as Error).message });
      throw err;
    }
  }

  async describeTable(schema: string, table: string): Promise<ColumnInfo[]> {
    this.logger.debug('Describing table', { schema, table });
    try {
      return await this.repo.describeTable(schema, table);
    } catch (err) {
      this.logger.error('Failed to describe table', { error: (err as Error).message });
      throw err;
    }
  }

  async listIndexes(schema: string, table: string): Promise<IndexInfo[]> {
    this.logger.debug('Listing indexes', { schema, table });
    try {
      return await this.repo.listIndexes(schema, table);
    } catch (err) {
      this.logger.error('Failed to list indexes', { error: (err as Error).message });
      throw err;
    }
  }

  async listViews(schema: string): Promise<ViewInfo[]> {
    this.logger.debug('Listing views', { schema });
    try {
      return await this.repo.listViews(schema);
    } catch (err) {
      this.logger.error('Failed to list views', { error: (err as Error).message });
      throw err;
    }
  }

  async listTriggers(schema: string): Promise<TriggerInfo[]> {
    this.logger.debug('Listing triggers', { schema });
    try {
      return await this.repo.listTriggers(schema);
    } catch (err) {
      this.logger.error('Failed to list triggers', { error: (err as Error).message });
      throw err;
    }
  }

  async listProcedures(schema: string): Promise<RoutineInfo[]> {
    this.logger.debug('Listing procedures', { schema });
    try {
      return await this.repo.listProcedures(schema);
    } catch (err) {
      this.logger.error('Failed to list procedures', { error: (err as Error).message });
      throw err;
    }
  }

  async listFunctions(schema: string): Promise<RoutineInfo[]> {
    this.logger.debug('Listing functions', { schema });
    try {
      return await this.repo.listFunctions(schema);
    } catch (err) {
      this.logger.error('Failed to list functions', { error: (err as Error).message });
      throw err;
    }
  }

  async listPartitions(schema: string, table: string): Promise<PartitionInfo[]> {
    this.logger.debug('Listing partitions', { schema, table });
    try {
      return await this.repo.listPartitions(schema, table);
    } catch (err) {
      this.logger.error('Failed to list partitions', { error: (err as Error).message });
      throw err;
    }
  }

  async foreignKeys(schema: string, table: string): Promise<ForeignKeyInfo[]> {
    this.logger.debug('Listing foreign keys', { schema, table });
    try {
      return await this.repo.foreignKeys(schema, table);
    } catch (err) {
      this.logger.error('Failed to list foreign keys', { error: (err as Error).message });
      throw err;
    }
  }

  async tableSize(schema: string, table?: string): Promise<SizeInfo[]> {
    this.logger.debug('Getting table size', { schema, table });
    try {
      return await this.repo.tableSize(schema, table);
    } catch (err) {
      this.logger.error('Failed to get table size', { error: (err as Error).message });
      throw err;
    }
  }

  async showCreateTable(schema: string, table: string): Promise<string> {
    this.logger.debug('Showing create table', { schema, table });
    try {
      return await this.repo.showCreateTable(schema, table);
    } catch (err) {
      this.logger.error('Failed to show create table', { error: (err as Error).message });
      throw err;
    }
  }

  async showCreateProcedure(schema: string, procedure: string): Promise<string> {
    this.logger.debug('Showing create procedure', { schema, procedure });
    try {
      return await this.repo.showCreateProcedure(schema, procedure);
    } catch (err) {
      this.logger.error('Failed to show create procedure', { error: (err as Error).message });
      throw err;
    }
  }

  async callProcedure(schema: string, procedure: string, args: unknown[]): Promise<ProcedureResult> {
    this.logger.debug('Calling procedure', { schema, procedure, args });
    try {
      return await this.repo.callProcedure(schema, procedure, args);
    } catch (err) {
      this.logger.error('Failed to call procedure', { error: (err as Error).message });
      throw err;
    }
  }

  async searchObjects(name: string, type?: ObjectType): Promise<SearchResult[]> {
    this.logger.debug('Searching objects', { name, type });
    try {
      return await this.repo.searchObjects(name, type);
    } catch (err) {
      this.logger.error('Failed to search objects', { error: (err as Error).message });
      throw err;
    }
  }
}
