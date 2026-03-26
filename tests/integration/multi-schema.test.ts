import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MySqlAdapter } from '../../src/infrastructure/database/mysql/mysql.adapter.js';
import { MySqlRepository } from '../../src/infrastructure/database/mysql/mysql.repository.js';

const DSN = process.env.MYSQL_DSN ?? 'mysql://root:root@localhost:3306/test';

describe('Multi-Schema Integration', () => {
  let adapter: MySqlAdapter;
  let repo: MySqlRepository;

  beforeAll(async () => {
    adapter = new MySqlAdapter();
    await adapter.connect(DSN, {
      maxOpen: 5,
      maxIdle: 2,
      maxLifetimeSeconds: 300,
    });
    repo = new MySqlRepository(adapter, []);
  });

  afterAll(async () => {
    await adapter.disconnect();
  });

  it('should list multiple schemas', async () => {
    const schemas = await repo.listSchemas();
    expect(schemas.length).toBeGreaterThan(0);
  });

  it('should switch schema without error', async () => {
    const schemas = await repo.listSchemas();
    if (schemas.length > 0) {
      await expect(repo.switchSchema(schemas[0].name)).resolves.not.toThrow();
    }
  });

  it('should search objects across schemas', async () => {
    const results = await repo.searchObjects('%');
    expect(Array.isArray(results)).toBe(true);
  });

  it('should execute cross-schema query with fully-qualified names', async () => {
    const result = await repo.executeQuery(
      'SELECT TABLE_NAME FROM information_schema.TABLES LIMIT 5',
      [],
      10,
      30,
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });
});
