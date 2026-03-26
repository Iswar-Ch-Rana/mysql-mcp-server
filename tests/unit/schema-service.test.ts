import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaService } from '../../src/application/services/schema.service.js';
import { MockSchemaRepository, MockLogger } from '../mocks/index.js';

describe('SchemaService', () => {
  let service: SchemaService;
  let repo: MockSchemaRepository;
  let logger: MockLogger;

  beforeEach(() => {
    repo = new MockSchemaRepository();
    logger = new MockLogger();
    service = new SchemaService(repo, logger);
  });

  it('should delegate listSchemas to repo', async () => {
    const schemas = [{ name: 'test', tableCount: 5, viewCount: 0, procedureCount: 0, functionCount: 0, sizeMb: 1 }];
    repo.listSchemas.mockResolvedValue(schemas);

    const result = await service.listSchemas();

    expect(repo.listSchemas).toHaveBeenCalled();
    expect(result).toEqual(schemas);
  });

  it('should delegate switchSchema to repo', async () => {
    await service.switchSchema('mydb');

    expect(repo.switchSchema).toHaveBeenCalledWith('mydb');
  });

  it('should delegate listTables to repo', async () => {
    await service.listTables('mydb');

    expect(repo.listTables).toHaveBeenCalledWith('mydb');
  });

  it('should delegate describeTable to repo', async () => {
    await service.describeTable('mydb', 'users');

    expect(repo.describeTable).toHaveBeenCalledWith('mydb', 'users');
  });

  it('should delegate listIndexes to repo', async () => {
    await service.listIndexes('mydb', 'users');

    expect(repo.listIndexes).toHaveBeenCalledWith('mydb', 'users');
  });

  it('should delegate listViews to repo', async () => {
    await service.listViews('mydb');

    expect(repo.listViews).toHaveBeenCalledWith('mydb');
  });

  it('should delegate listTriggers to repo', async () => {
    await service.listTriggers('mydb');

    expect(repo.listTriggers).toHaveBeenCalledWith('mydb');
  });

  it('should delegate listProcedures to repo', async () => {
    await service.listProcedures('mydb');

    expect(repo.listProcedures).toHaveBeenCalledWith('mydb');
  });

  it('should delegate listFunctions to repo', async () => {
    await service.listFunctions('mydb');

    expect(repo.listFunctions).toHaveBeenCalledWith('mydb');
  });

  it('should delegate listPartitions to repo', async () => {
    await service.listPartitions('mydb', 'users');

    expect(repo.listPartitions).toHaveBeenCalledWith('mydb', 'users');
  });

  it('should delegate foreignKeys to repo', async () => {
    await service.foreignKeys('mydb', 'users');

    expect(repo.foreignKeys).toHaveBeenCalledWith('mydb', 'users');
  });

  it('should delegate tableSize to repo', async () => {
    await service.tableSize('mydb', 'users');

    expect(repo.tableSize).toHaveBeenCalledWith('mydb', 'users');
  });

  it('should delegate showCreateTable to repo', async () => {
    await service.showCreateTable('mydb', 'users');

    expect(repo.showCreateTable).toHaveBeenCalledWith('mydb', 'users');
  });

  it('should delegate searchObjects to repo', async () => {
    await service.searchObjects('user', 'table');

    expect(repo.searchObjects).toHaveBeenCalledWith('user', 'table');
  });

  it('should propagate errors from repo', async () => {
    repo.listTables.mockRejectedValue(new Error('db error'));

    await expect(service.listTables('mydb')).rejects.toThrow('db error');
    expect(logger.error).toHaveBeenCalled();
  });
});
