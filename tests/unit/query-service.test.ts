import { describe, it, expect, beforeEach } from 'vitest';
import { QueryService } from '../../src/application/services/query.service.js';
import { MockQueryRepository, MockSqlValidator, MockAuditLogger } from '../mocks/index.js';
import { SqlValidationError } from '../../src/domain/errors.js';

describe('QueryService', () => {
  let service: QueryService;
  let queryRepo: MockQueryRepository;
  let validator: MockSqlValidator;
  let auditLogger: MockAuditLogger;

  beforeEach(() => {
    queryRepo = new MockQueryRepository();
    validator = new MockSqlValidator();
    auditLogger = new MockAuditLogger();
    service = new QueryService(queryRepo, validator, auditLogger, 200, 30);
  });

  describe('runQuery', () => {
    it('should validate, execute, and audit a valid query', async () => {
      const result = await service.runQuery('SELECT 1');

      expect(validator.validate).toHaveBeenCalledWith('SELECT 1');
      expect(queryRepo.executeQuery).toHaveBeenCalledWith('SELECT 1', [], 200, 30);
      expect(auditLogger.logQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'SELECT 1',
          success: true,
        }),
      );
      expect(result.rowCount).toBe(1);
    });

    it('should throw SqlValidationError for invalid query', async () => {
      validator.validate.mockReturnValue({ isValid: false, reason: 'blocked' });

      await expect(service.runQuery('DROP TABLE x')).rejects.toThrow(SqlValidationError);
      expect(queryRepo.executeQuery).not.toHaveBeenCalled();
    });

    it('should audit with success: false on execution failure', async () => {
      queryRepo.executeQuery.mockRejectedValue(new Error('db error'));

      await expect(service.runQuery('SELECT 1')).rejects.toThrow('db error');
      expect(auditLogger.logQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'SELECT 1',
          success: false,
        }),
      );
    });

    it('should use custom maxRows when provided', async () => {
      await service.runQuery('SELECT 1', undefined, 50);

      expect(queryRepo.executeQuery).toHaveBeenCalledWith('SELECT 1', [], 50, 30);
    });
  });

  describe('explainQuery', () => {
    it('should validate and delegate to repo', async () => {
      const result = await service.explainQuery('SELECT 1');

      expect(validator.validate).toHaveBeenCalledWith('SELECT 1');
      expect(queryRepo.explainQuery).toHaveBeenCalledWith('SELECT 1', 'default');
      expect(result.rowCount).toBe(1);
    });

    it('should throw for invalid query', async () => {
      validator.validate.mockReturnValue({ isValid: false, reason: 'blocked' });

      await expect(service.explainQuery('DROP TABLE x')).rejects.toThrow(SqlValidationError);
      expect(queryRepo.explainQuery).not.toHaveBeenCalled();
    });
  });
});
