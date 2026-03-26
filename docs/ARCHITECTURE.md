# Architecture

The project follows **Clean Architecture** with four distinct layers. Dependencies point inward — outer layers depend on inner layers, never the reverse.

## Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Interface Layer                       │
│  (MCP tools, HTTP server, CLI argument parser)          │
└────────────────────────┬────────────────────────────────┘
                         │ depends on
┌────────────────────────▼────────────────────────────────┐
│                  Application Layer                      │
│  (DatabaseService, SchemaService, QueryService,         │
│   ConnectionService)                                    │
└────────────────────────┬────────────────────────────────┘
                         │ depends on
┌────────────────────────▼────────────────────────────────┐
│                    Domain Layer                          │
│  (Interfaces, validators, error types)                  │
└────────────────────────▲────────────────────────────────┘
                         │ implements
┌────────────────────────┴────────────────────────────────┐
│                Infrastructure Layer                     │
│  (MySQL adapter, SSH tunnel, logging, config loader,    │
│   SQL validators, transports)                           │
└─────────────────────────────────────────────────────────┘
```

## Directory Map

```
src/
  domain/                          # Core business rules
    interfaces/
      database-repository.ts       # IDatabaseRepository
      schema-repository.ts         # ISchemaRepository
      query-repository.ts          # IQueryRepository
      sql-validator.ts             # ISqlValidator, ValidationResult
      logger.ts                    # ILogger
      audit-logger.ts              # IAuditLogger
    validators/
      sql.validator.ts             # isReadOnlyStatement, hasMultipleStatements, etc.
      identifier.validator.ts      # isValidIdentifier, quoteIdentifier
    errors.ts                      # ValidationError, ConnectionError, QueryError, etc.

  application/                     # Use-case services
    services/
      database.service.ts          # listDatabases, ping, serverInfo, databaseSize, ...
      schema.service.ts            # listTables, describeTable, listIndexes, ...
      query.service.ts             # validate → execute → audit pipeline
      connection.service.ts        # listConnections, switchConnection

  infrastructure/                  # External adapters
    database/mysql/
      mysql.adapter.ts             # MySqlAdapter (mysql2 wrapper)
      mysql.repository.ts          # MySqlRepository (implements domain interfaces)
      mysql.utils.ts               # parseDsn, maskDsn
    security/
      ast-sql-validator.ts         # AstSqlValidator (node-sql-parser)
      regex-sql-validator.ts       # RegexSqlValidator (pattern matching)
      composite-sql-validator.ts   # CompositeSqlValidator (chains validators)
    logging/
      logger.ts                    # WinstonLogger
      audit.ts                     # FileAuditLogger (JSONL)
    config/
      env.ts                       # parseEnvConfig (MYSQL_* env vars)
      loader.ts                    # loadConfig (CLI > env > file > defaults)
    tunnel/
      ssh.tunnel.ts                # SshTunnel (ssh2)
    transport/
      stdio.transport.ts           # StdioTransport (MCP SDK)
      http.transport.ts            # HttpTransport (wraps HttpServer)

  interface/                       # Delivery mechanisms
    tools/
      registry.ts                  # ToolRegistry, ToolDefinition, buildAll()
      list-databases.tool.ts       # 28 individual tool files
      list-tables.tool.ts
      describe-table.tool.ts
      run-query.tool.ts
      ping.tool.ts
      server-info.tool.ts
      ... (19 more tool files)
    http/
      server.ts                    # HttpServer (Express)
      middleware.ts                # Rate limiter, API key auth, error handler
    cli/
      args.ts                      # parseArgs (CLI argument parser)

  shared/                          # Cross-cutting concerns
    config.ts                      # AppConfig, ConnectionConfig, etc.
    constants.ts                   # DEFAULT_MAX_ROWS, VERSION, etc.

  index.ts                         # Composition root (wires everything)
```

## Dependency Flow

### Domain Layer (Innermost)

- **Zero external dependencies** — only TypeScript built-in types
- Defines interfaces (`IDatabaseRepository`, `ISqlValidator`, etc.)
- Contains pure validation functions (`isReadOnlyStatement`, `quoteIdentifier`)
- Defines error types (`ValidationError`, `ConnectionError`, `QueryError`)

### Application Layer

- Depends on **domain interfaces only**
- Never imports from `infrastructure/` or `interface/`
- Orchestrates business logic:
  - `QueryService`: validate SQL → execute query → log to audit
  - `SchemaService`: delegates to `ISchemaRepository`
  - `DatabaseService`: delegates to `IDatabaseRepository`
  - `ConnectionService`: manages named connections

### Infrastructure Layer

- **Implements** domain interfaces
- Contains all external library dependencies:
  - `mysql2` — MySQL connectivity
  - `node-sql-parser` — AST-based SQL validation
  - `ssh2` — SSH tunnel
  - `winston` — structured logging
  - `express` — HTTP server
  - `yaml` — config file parsing
- Each adapter is a standalone class that can be swapped independently

### Interface Layer (Outermost)

- Defines MCP tool shapes (name, description, input schema, handler)
- `ToolRegistry` registers tools and wires them to application services
- `HttpServer` exposes tools via REST API
- `parseArgs` handles CLI argument parsing

### Composition Root (`src/index.ts`)

- The **only place** where all layers meet
- Creates concrete instances and injects dependencies
- Wiring order: config → logger → tunnel → adapter → repository → validator → services → tools → transport

## Key Patterns

### Dependency Injection

All services receive their dependencies through constructor parameters — no service locators or global singletons:

```typescript
const queryService = new QueryService(
  repository,       // IQueryRepository
  sqlValidator,     // ISqlValidator
  auditLogger,      // IAuditLogger
  maxRows,
  timeoutSeconds,
);
```

### Composite Validator

SQL validation uses the Composite pattern — multiple validators run in sequence, and the first failure short-circuits:

```typescript
const sqlValidator = new CompositeSqlValidator([
  new AstSqlValidator(),    // AST-based (node-sql-parser)
  new RegexSqlValidator(),  // Pattern-based (regex fallback)
]);
```

### Tool Factory Pattern

Each tool is created by a factory function that closes over its service dependency:

```typescript
export function createListTablesTool(service: SchemaService): ToolDefinition {
  return {
    name: 'list_tables',
    inputSchema: z.object({ schema: z.string() }),
    handler: async (input) => { /* uses service */ },
  };
}
```

### Feature Flags

Extended tools (13 of 25) are gated behind the `extendedTools` feature flag. Core tools (12) are always registered:

```typescript
// Always registered: 6 core + 4 schema + 2 connection = 12
// Conditionally registered: 16 extended tools
if (flags.extendedTools) {
  this.register(createListIndexesTool(services.schema));
  // ... 12 more
}
```
