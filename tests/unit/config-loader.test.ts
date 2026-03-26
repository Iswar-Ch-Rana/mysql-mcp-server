import { describe, it, expect } from 'vitest';
import { parseEnvConfig } from '../../src/infrastructure/config/env.js';
import { mergeConfigs, loadConfig } from '../../src/infrastructure/config/loader.js';
import { ConfigError } from '../../src/domain/errors.js';

describe('parseEnvConfig', () => {
  it('should map MYSQL_DSN to connections.default.dsn', () => {
    const result = parseEnvConfig({ MYSQL_DSN: 'mysql://root:pass@localhost/test' });
    expect(result.connections?.default?.dsn).toBe('mysql://root:pass@localhost/test');
  });

  it('should map MYSQL_MAX_ROWS to query.maxRows', () => {
    const result = parseEnvConfig({ MYSQL_MAX_ROWS: '500' });
    expect(result.query?.maxRows).toBe(500);
  });

  it('should map MYSQL_MCP_QUERY_TIMEOUT to query.timeoutSeconds', () => {
    const result = parseEnvConfig({ MYSQL_MCP_QUERY_TIMEOUT: '60' });
    expect(result.query?.timeoutSeconds).toBe(60);
  });

  it('should map MYSQL_MCP_EXTENDED to features.extendedTools', () => {
    const result = parseEnvConfig({ MYSQL_MCP_EXTENDED: 'true' });
    expect(result.features?.extendedTools).toBe(true);
  });

  it('should map MYSQL_MCP_JSON_LOGS to logging.jsonLogs', () => {
    const result = parseEnvConfig({ MYSQL_MCP_JSON_LOGS: '1' });
    expect(result.logging?.jsonLogs).toBe(true);
  });

  it('should map MYSQL_MCP_AUDIT_LOG to logging.auditLogPath', () => {
    const result = parseEnvConfig({ MYSQL_MCP_AUDIT_LOG: '/var/log/audit.jsonl' });
    expect(result.logging?.auditLogPath).toBe('/var/log/audit.jsonl');
  });

  it('should map MYSQL_MCP_HTTP_PORT to http.port', () => {
    const result = parseEnvConfig({ MYSQL_MCP_HTTP_PORT: '8080' });
    expect(result.http?.port).toBe(8080);
  });

  it('should map MYSQL_MCP_API_KEY to http.apiKey', () => {
    const result = parseEnvConfig({ MYSQL_MCP_API_KEY: 'secret123' });
    expect(result.http?.apiKey).toBe('secret123');
  });

  it('should map SSH env vars', () => {
    const result = parseEnvConfig({
      MYSQL_MCP_SSH_HOST: 'bastion.example.com',
      MYSQL_MCP_SSH_USER: 'admin',
      MYSQL_MCP_SSH_KEY_PATH: '/home/user/.ssh/id_rsa',
      MYSQL_MCP_SSH_PORT: '2222',
    });
    expect(result.ssh?.host).toBe('bastion.example.com');
    expect(result.ssh?.user).toBe('admin');
    expect(result.ssh?.keyPath).toBe('/home/user/.ssh/id_rsa');
    expect(result.ssh?.port).toBe(2222);
  });

  it('should return partial config for missing env vars', () => {
    const result = parseEnvConfig({});
    expect(result.connections).toBeUndefined();
    expect(result.query).toBeUndefined();
  });
});

describe('mergeConfigs', () => {
  it('should deep merge nested objects', () => {
    const result = mergeConfigs(
      { query: { maxRows: 500 } } as any,
      { query: { timeoutSeconds: 60 } } as any,
    );
    expect(result.query.maxRows).toBe(500);
    expect(result.query.timeoutSeconds).toBe(60);
  });

  it('should let later configs override earlier ones', () => {
    const result = mergeConfigs(
      { query: { maxRows: 100 } } as any,
      { query: { maxRows: 500 } } as any,
    );
    expect(result.query.maxRows).toBe(500);
  });
});

describe('loadConfig', () => {
  it('should throw ConfigError when DSN is missing', async () => {
    await expect(loadConfig({}, {})).rejects.toThrow(ConfigError);
  });

  it('should accept DSN from CLI args', async () => {
    const config = await loadConfig(
      { dsn: 'mysql://root:pass@localhost/test' },
      {},
    );
    expect(config.connections.default.dsn).toBe('mysql://root:pass@localhost/test');
  });

  it('should accept DSN from env', async () => {
    const config = await loadConfig(
      {},
      { MYSQL_DSN: 'mysql://root:pass@localhost/test' },
    );
    expect(config.connections.default.dsn).toBe('mysql://root:pass@localhost/test');
  });

  it('should prioritize CLI over env', async () => {
    const config = await loadConfig(
      { dsn: 'mysql://cli@localhost/cli' },
      { MYSQL_DSN: 'mysql://env@localhost/env' },
    );
    expect(config.connections.default.dsn).toBe('mysql://cli@localhost/cli');
  });
});
