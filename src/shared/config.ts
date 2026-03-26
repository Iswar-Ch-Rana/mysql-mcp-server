export interface ConnectionConfig {
  name: string;
  dsn: string;
}

export interface PoolConfig {
  maxOpen: number;
  maxIdle: number;
  maxLifetimeSeconds: number;
}

export interface QueryConfig {
  maxRows: number;
  timeoutSeconds: number;
}

export interface HttpConfig {
  enabled: boolean;
  port: number;
  host: string;
  apiKey: string;
  rateLimitEnabled: boolean;
  rateLimitRps: number;
  rateLimitBurst: number;
}

export interface SshConfig {
  host: string;
  port: number;
  user: string;
  keyPath: string;
}

export interface SslConfig {
  mode: 'disabled' | 'preferred' | 'required';
  ca: string;
  cert: string;
  key: string;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  silent: boolean;
  jsonLogs: boolean;
  auditLogPath: string;
}

export interface SchemaFilterConfig {
  exclude: string[];
  include: string[];
}

export interface FeatureFlags {
  extendedTools: boolean;
  tokenTracking: boolean;
}

export interface AppConfig {
  connections: Record<string, ConnectionConfig> & { default: ConnectionConfig };
  pool: PoolConfig;
  query: QueryConfig;
  http: HttpConfig;
  ssh: SshConfig;
  ssl: SslConfig;
  logging: LoggingConfig;
  schemas: SchemaFilterConfig;
  features: FeatureFlags;
}
