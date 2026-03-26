import dotenv from 'dotenv';
import { parseArgs } from './interface/cli/args.js';
import { loadConfig } from './infrastructure/config/loader.js';
import { WinstonLogger } from './infrastructure/logging/logger.js';
import { FileAuditLogger } from './infrastructure/logging/audit.js';
import { SshTunnel } from './infrastructure/tunnel/ssh.tunnel.js';
import { MySqlAdapter } from './infrastructure/database/mysql/mysql.adapter.js';
import { MySqlRepository } from './infrastructure/database/mysql/mysql.repository.js';
import { AstSqlValidator } from './infrastructure/security/ast-sql-validator.js';
import { RegexSqlValidator } from './infrastructure/security/regex-sql-validator.js';
import { CompositeSqlValidator } from './infrastructure/security/composite-sql-validator.js';
import { DatabaseService } from './application/services/database.service.js';
import { SchemaService } from './application/services/schema.service.js';
import { QueryService } from './application/services/query.service.js';
import { ConnectionService } from './application/services/connection.service.js';
import { ToolRegistry } from './interface/tools/registry.js';
import { StdioTransport } from './infrastructure/transport/stdio.transport.js';
import { HttpTransport } from './infrastructure/transport/http.transport.js';
import { maskDsn, parseDsn } from './infrastructure/database/mysql/mysql.utils.js';
import { VERSION } from './shared/constants.js';

async function main(): Promise<void> {
  dotenv.config();

  const cliArgs = parseArgs(process.argv);
  const config = await loadConfig(cliArgs, process.env);

  // Handle early exits
  if (cliArgs.version) {
    console.error(VERSION);
    process.exit(0);
  }

  if (cliArgs.printConfig) {
    const masked = {
      ...config,
      connections: Object.fromEntries(
        Object.entries(config.connections).map(([name, conn]) => [
          name,
          { ...conn, dsn: maskDsn(conn.dsn) },
        ]),
      ),
    };
    console.error(JSON.stringify(masked, null, 2));
    process.exit(0);
  }

  if (cliArgs.validateConfig) {
    console.error('Config OK');
    process.exit(0);
  }

  // Create logger and audit logger
  const logger = new WinstonLogger(config.logging);
  const auditLogger = new FileAuditLogger(config.logging.auditLogPath || undefined);

  // SSH tunnel (if configured)
  let tunnel: SshTunnel | null = null;
  let dsn = config.connections.default.dsn;

  if (config.ssh.host) {
    tunnel = new SshTunnel();
    const parsed = parseDsn(dsn);
    const localPort = await tunnel.open(config.ssh, parsed.host, parsed.port);
    // Rewrite DSN to use localhost:localPort
    const url = new URL(dsn);
    url.hostname = '127.0.0.1';
    url.port = String(localPort);
    dsn = url.toString();
    logger.info('SSH tunnel established', { localPort });
  }

  // Create database adapter and connect
  const adapter = new MySqlAdapter(logger);
  await adapter.connect(dsn, config.pool, config.ssl);
  logger.info('Connected to MySQL', { dsn: maskDsn(dsn) });

  // Create repository
  const repository = new MySqlRepository(adapter, config.schemas.exclude);

  // Create SQL validator
  const sqlValidator = new CompositeSqlValidator([
    new AstSqlValidator(),
    new RegexSqlValidator(),
  ]);

  // Create services
  const databaseService = new DatabaseService(repository, logger);
  const schemaService = new SchemaService(repository, logger);
  const queryService = new QueryService(
    repository,
    sqlValidator,
    auditLogger,
    config.query.maxRows,
    config.query.timeoutSeconds,
  );
  const connectionService = new ConnectionService(config.connections, logger);

  // Create tool registry and build all tools
  const registry = new ToolRegistry();
  registry.buildAll(
    {
      database: databaseService,
      schema: schemaService,
      query: queryService,
      connection: connectionService,
    },
    config.features,
  );

  logger.info('Tools registered', { count: registry.getNames().length });

  // Transport selection
  let transport: StdioTransport | HttpTransport;

  if (config.http.enabled || cliArgs.transport === 'http') {
    transport = new HttpTransport(config.http, registry, logger);
  } else {
    transport = new StdioTransport(registry, logger);
  }

  await transport.start();

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info('Shutting down', { signal });

    await transport.stop();
    await adapter.disconnect();

    if (tunnel) {
      await tunnel.close();
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
