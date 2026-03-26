export const SYSTEM_SCHEMAS: string[] = [
  'information_schema',
  'performance_schema',
  'mysql',
  'sys',
];

export const DEFAULT_MAX_ROWS = 200;
export const DEFAULT_QUERY_TIMEOUT_SECONDS = 30;
export const DEFAULT_POOL_MAX_OPEN = 10;
export const DEFAULT_POOL_MAX_IDLE = 5;
export const DEFAULT_POOL_MAX_LIFETIME_SECONDS = 300;
export const DEFAULT_HTTP_PORT = 3000;
export const DEFAULT_SSH_PORT = 22;
export const SCHEMA_CACHE_TTL_MS = 60_000;
export const MAX_REQUEST_BODY_BYTES = 1_048_576;
export const VERSION = '1.0.0';
