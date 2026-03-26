import type { AppConfig, ConnectionConfig } from '../../shared/config.js';

export function parseEnvConfig(env: NodeJS.ProcessEnv): Partial<AppConfig> {
  const config: Record<string, unknown> = {};

  // Connections — individual vars take priority over MYSQL_DSN
  if (env.MYSQL_HOST || env.MYSQL_USER) {
    const host = env.MYSQL_HOST ?? 'localhost';
    const port = env.MYSQL_PORT ?? '3306';
    const user = encodeURIComponent(env.MYSQL_USER ?? '');
    const password = encodeURIComponent(env.MYSQL_PASSWORD ?? '');
    const database = encodeURIComponent(env.MYSQL_DATABASE ?? '');
    const dsn = `mysql://${user}:${password}@${host}:${port}/${database}`;
    config.connections = {
      default: { name: 'default', dsn } satisfies ConnectionConfig,
    };
  } else if (env.MYSQL_DSN) {
    config.connections = {
      default: { name: 'default', dsn: env.MYSQL_DSN } satisfies ConnectionConfig,
    };
  }

  if (env.MYSQL_CONNECTIONS) {
    try {
      const parsed = JSON.parse(env.MYSQL_CONNECTIONS) as Record<string, { dsn: string }>;
      const connections: Record<string, ConnectionConfig> = {};
      for (const [name, value] of Object.entries(parsed)) {
        connections[name] = { name, dsn: value.dsn };
      }
      config.connections = connections;
    } catch {
      // Ignore invalid JSON
    }
  }

  // Query config
  const query: Record<string, unknown> = {};
  if (env.MYSQL_MAX_ROWS) {
    query.maxRows = parseInt(env.MYSQL_MAX_ROWS, 10);
  }
  if (env.MYSQL_MCP_QUERY_TIMEOUT) {
    query.timeoutSeconds = parseInt(env.MYSQL_MCP_QUERY_TIMEOUT, 10);
  }
  if (Object.keys(query).length > 0) {
    config.query = query;
  }

  // Feature flags
  const features: Record<string, unknown> = {};
  if (env.MYSQL_MCP_EXTENDED) {
    features.extendedTools = isTruthy(env.MYSQL_MCP_EXTENDED);
  }
  if (Object.keys(features).length > 0) {
    config.features = features;
  }

  // Logging
  const logging: Record<string, unknown> = {};
  if (env.MYSQL_MCP_LOG_LEVEL) {
    logging.level = env.MYSQL_MCP_LOG_LEVEL;
  }
  if (env.MYSQL_MCP_JSON_LOGS) {
    logging.jsonLogs = isTruthy(env.MYSQL_MCP_JSON_LOGS);
  }
  if (env.MYSQL_MCP_AUDIT_LOG) {
    logging.auditLogPath = env.MYSQL_MCP_AUDIT_LOG;
  }
  if (env.MYSQL_MCP_SILENT) {
    logging.silent = isTruthy(env.MYSQL_MCP_SILENT);
  }
  if (Object.keys(logging).length > 0) {
    config.logging = logging;
  }

  // HTTP
  const http: Record<string, unknown> = {};
  if (env.MYSQL_MCP_HTTP_PORT) {
    http.port = parseInt(env.MYSQL_MCP_HTTP_PORT, 10);
  }
  if (env.MYSQL_MCP_API_KEY) {
    http.apiKey = env.MYSQL_MCP_API_KEY;
  }
  if (env.MYSQL_MCP_HTTP) {
    http.enabled = isTruthy(env.MYSQL_MCP_HTTP);
  }
  if (env.MYSQL_MCP_RATE_LIMIT_ENABLED) {
    http.rateLimitEnabled = isTruthy(env.MYSQL_MCP_RATE_LIMIT_ENABLED);
  }
  if (env.MYSQL_MCP_RATE_LIMIT_RPS) {
    http.rateLimitRps = parseInt(env.MYSQL_MCP_RATE_LIMIT_RPS, 10);
  }
  if (env.MYSQL_MCP_RATE_LIMIT_BURST) {
    http.rateLimitBurst = parseInt(env.MYSQL_MCP_RATE_LIMIT_BURST, 10);
  }
  if (Object.keys(http).length > 0) {
    config.http = http;
  }

  // SSH
  const ssh: Record<string, unknown> = {};
  if (env.MYSQL_MCP_SSH_HOST) {
    ssh.host = env.MYSQL_MCP_SSH_HOST;
  }
  if (env.MYSQL_MCP_SSH_USER) {
    ssh.user = env.MYSQL_MCP_SSH_USER;
  }
  if (env.MYSQL_MCP_SSH_KEY_PATH) {
    ssh.keyPath = env.MYSQL_MCP_SSH_KEY_PATH;
  }
  if (env.MYSQL_MCP_SSH_PORT) {
    ssh.port = parseInt(env.MYSQL_MCP_SSH_PORT, 10);
  }
  if (Object.keys(ssh).length > 0) {
    config.ssh = ssh;
  }

  return config as Partial<AppConfig>;
}

function isTruthy(value: string): boolean {
  return ['1', 'true', 'yes'].includes(value.toLowerCase());
}
