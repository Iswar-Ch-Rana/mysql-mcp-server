import { readFileSync, existsSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { AppConfig } from '../../shared/config.js';
import {
  DEFAULT_MAX_ROWS,
  DEFAULT_QUERY_TIMEOUT_SECONDS,
  DEFAULT_POOL_MAX_OPEN,
  DEFAULT_POOL_MAX_IDLE,
  DEFAULT_POOL_MAX_LIFETIME_SECONDS,
  DEFAULT_HTTP_PORT,
  DEFAULT_SSH_PORT,
} from '../../shared/constants.js';
import { ConfigError } from '../../domain/errors.js';
import { parseEnvConfig } from './env.js';
import type { CliArgs } from '../../interface/cli/args.js';

const DEFAULT_CONFIG: AppConfig = {
  connections: {
    default: { name: 'default', dsn: '' },
  },
  pool: {
    maxOpen: DEFAULT_POOL_MAX_OPEN,
    maxIdle: DEFAULT_POOL_MAX_IDLE,
    maxLifetimeSeconds: DEFAULT_POOL_MAX_LIFETIME_SECONDS,
  },
  query: {
    maxRows: DEFAULT_MAX_ROWS,
    timeoutSeconds: DEFAULT_QUERY_TIMEOUT_SECONDS,
  },
  http: {
    enabled: false,
    port: DEFAULT_HTTP_PORT,
    host: '127.0.0.1',
    apiKey: '',
    rateLimitEnabled: false,
    rateLimitRps: 10,
    rateLimitBurst: 20,
  },
  ssh: {
    host: '',
    port: DEFAULT_SSH_PORT,
    user: '',
    keyPath: '',
  },
  ssl: {
    mode: 'disabled',
    ca: '',
    cert: '',
    key: '',
  },
  logging: {
    level: 'info',
    silent: false,
    jsonLogs: false,
    auditLogPath: '',
  },
  schemas: {
    exclude: [],
    include: [],
  },
  features: {
    extendedTools: false,
    tokenTracking: false,
  },
};

export function loadConfigFile(path: string): Partial<AppConfig> {
  if (!existsSync(path)) {
    return {};
  }

  const raw = readFileSync(path, 'utf-8');

  if (path.endsWith('.json')) {
    return JSON.parse(raw) as Partial<AppConfig>;
  }

  if (path.endsWith('.yaml') || path.endsWith('.yml')) {
    return parseYaml(raw) as Partial<AppConfig>;
  }

  return {};
}

export function mergeConfigs(...configs: Partial<AppConfig>[]): AppConfig {
  const result = structuredClone(DEFAULT_CONFIG) as unknown as Record<string, unknown>;

  for (const config of configs) {
    for (const [key, value] of Object.entries(config)) {
      if (value === undefined || value === null) {
        continue;
      }
      if (typeof value === 'object' && !Array.isArray(value) && result[key] && typeof result[key] === 'object') {
        result[key] = { ...(result[key] as Record<string, unknown>), ...(value as Record<string, unknown>) };
      } else {
        result[key] = value;
      }
    }
  }

  return result as unknown as AppConfig;
}

function cliToPartialConfig(args: CliArgs): Partial<AppConfig> {
  const config: Record<string, unknown> = {};

  if (args.dsn) {
    config.connections = {
      default: { name: 'default', dsn: args.dsn },
    };
  }

  if (args.port !== undefined) {
    config.http = { enabled: true, port: args.port };
  }

  if (args.silent !== undefined) {
    config.logging = { silent: args.silent };
  }

  if (args.logLevel) {
    config.logging = { ...(config.logging as Record<string, unknown> || {}), level: args.logLevel };
  }

  return config as Partial<AppConfig>;
}

export async function loadConfig(cliArgs: CliArgs, env: NodeJS.ProcessEnv): Promise<AppConfig> {
  // Priority: CLI > env > file > defaults
  const envConfig = parseEnvConfig(env);

  let fileConfig: Partial<AppConfig> = {};
  if (cliArgs.configPath) {
    fileConfig = loadConfigFile(cliArgs.configPath);
  } else if (existsSync('config.yaml')) {
    fileConfig = loadConfigFile('config.yaml');
  } else if (existsSync('config.yml')) {
    fileConfig = loadConfigFile('config.yml');
  } else if (existsSync('config.json')) {
    fileConfig = loadConfigFile('config.json');
  }

  const cliConfig = cliToPartialConfig(cliArgs);

  const merged = mergeConfigs(fileConfig, envConfig, cliConfig);

  if (!merged.connections.default.dsn) {
    throw new ConfigError('Missing required configuration: connections.default.dsn (set MYSQL_DSN or --dsn)');
  }

  return merged;
}
