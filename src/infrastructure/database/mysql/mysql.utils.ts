import type { PoolOptions } from 'mysql2/promise';
import type { PoolConfig, SslConfig } from '../../../shared/config.js';

export interface ConnectionOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
}

export function parseDsn(dsn: string): ConnectionOptions {
  const url = new URL(dsn);
  return {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.length > 1 ? decodeURIComponent(url.pathname.slice(1)) : undefined,
  };
}

export function isMariaDb(version: string): boolean {
  return /mariadb/i.test(version);
}

export function buildConnectionOptions(dsn: string, pool: PoolConfig, ssl?: SslConfig): PoolOptions {
  const parsed = parseDsn(dsn);

  const options: PoolOptions = {
    host: parsed.host,
    port: parsed.port,
    user: parsed.user,
    password: parsed.password,
    database: parsed.database,
    connectionLimit: pool.maxOpen,
    idleTimeout: pool.maxLifetimeSeconds * 1000,
    waitForConnections: true,
    enableKeepAlive: true,
  };

  if (ssl && ssl.mode !== 'disabled') {
    const sslOptions: Record<string, unknown> = {};
    if (ssl.ca) sslOptions.ca = ssl.ca;
    if (ssl.cert) sslOptions.cert = ssl.cert;
    if (ssl.key) sslOptions.key = ssl.key;
    if (ssl.mode === 'required') sslOptions.rejectUnauthorized = true;
    options.ssl = sslOptions;
  }

  return options;
}

export function maskDsn(dsn: string): string {
  try {
    const url = new URL(dsn);
    if (url.password) {
      url.password = '***';
    }
    return url.toString();
  } catch {
    return dsn.replace(/:([^@]+)@/, ':***@');
  }
}
