# MySQL MCP Server

A **read-only MySQL MCP (Model Context Protocol) server** built with TypeScript and Clean Architecture. Exposes 28 database tools to any MCP-compatible AI client — Claude Desktop, Claude Code, GitHub Copilot, Cursor, Codex CLI, and more — over stdio or HTTP.

**Problem it solves:** AI assistants that need to reason about a real database require a safe, structured interface. This server provides exactly that: a read-only SQL gateway with SQL injection protection, schema introspection, and multi-connection support, all wired up to the MCP protocol so any compliant AI client can use it out of the box.

---

## Features

- **Read-only by design** — only `SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN`, and `USE` are permitted
- **SQL injection protection** — dual-layer validation: AST parsing (`node-sql-parser`) + regex fallback
- **28 database tools** — schema browsing, query execution, server introspection, procedure comparison
- **Multi-connection** — define named connections and switch between them at runtime
- **Dual transport** — MCP stdio (default) or HTTP REST API
- **SSH tunneling** — connect through SSH bastion hosts
- **Audit logging** — JSONL audit trail for all executed queries
- **Schema filtering** — include/exclude schemas visible to the AI client
- **Config layering** — CLI args > env vars > YAML/JSON config file > built-in defaults

---

## Tech Stack

| Concern | Library |
|---------|---------|
| MCP protocol | `@modelcontextprotocol/sdk` |
| MySQL driver | `mysql2` |
| SQL validation | `node-sql-parser` (AST) + regex |
| HTTP server | `express` + `express-rate-limit` |
| SSH tunneling | `ssh2` |
| Config file | `yaml` |
| Schema validation | `zod` |
| Logging | `winston` |
| Token counting | `gpt-tokenizer` |
| Runtime | Node.js >= 20 (ESM) |
| Language | TypeScript 5, strict mode |
| Tests | Vitest (unit + integration) |

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd mysql-mcp-server-ts
npm install

# 2. Configure (copy and edit)
cp .env.example .env

# 3. Build
npm run build

# 4. Run (stdio/MCP mode)
npm start

# Or start in HTTP mode to test with curl / Postman
npm run start:http
curl http://localhost:3000/health
```

---

## Installation & Setup

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 9.x
- A MySQL server (5.7+ or 8.x) with read access

### Step-by-step

```bash
# Clone
git clone <repo-url>
cd mysql-mcp-server-ts

# Install dependencies
npm install

# Copy the example env file
cp .env.example .env
```

Edit `.env` — at minimum, set one of:

```env
# Option A: DSN string
MYSQL_DSN=mysql://user:password@localhost:3306/mydb

# Option B: Individual variables (handles special chars in password)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=user
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=mydb
```

Then build and run:

```bash
npm run build
npm start
```

---

## Environment Configuration

All configuration is in `.env`. Copy `.env.example` to get started — every variable is commented with a description.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MYSQL_DSN` | One of DSN or individual vars | — | `mysql://user:pass@host:3306/db` |
| `MYSQL_HOST` / `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_PORT` / `MYSQL_DATABASE` | — | — | Individual connection fields |
| `MYSQL_CONNECTIONS` | No | — | JSON object of named connections |
| `MYSQL_MAX_ROWS` | No | `200` | Max rows per query |
| `MYSQL_MCP_QUERY_TIMEOUT` | No | `30` | Query timeout (seconds) |
| `MYSQL_MCP_EXTENDED` | No | `false` | Enable all 28 tools |
| `MYSQL_MCP_HTTP` | No | `false` | Enable HTTP transport |
| `MYSQL_MCP_HTTP_PORT` | No | `3000` | HTTP server port |
| `MYSQL_MCP_API_KEY` | No | — | API key for HTTP auth |
| `MYSQL_MCP_LOG_LEVEL` | No | `info` | `debug`\|`info`\|`warn`\|`error` |
| `MYSQL_MCP_AUDIT_LOG` | No | — | Path to JSONL audit log |
| `MYSQL_MCP_SSH_HOST` | No | — | SSH bastion hostname |
| `MYSQL_MCP_SSH_USER` | No | — | SSH username |
| `MYSQL_MCP_SSH_KEY_PATH` | No | — | Path to SSH private key |

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for the full reference including SSL, rate limiting, connection pools, and schema filtering.

---

## Build & Usage

### Development (live reload)

```bash
npm run dev          # stdio mode
npm run dev:http     # HTTP mode
```

### Production build

```bash
npm run build        # compiles TypeScript → dist/
npm start            # stdio/MCP mode
npm run start:http   # HTTP mode (default port 3000)
```

### CLI arguments

```bash
npm start -- --dsn "mysql://user:pass@localhost:3306/mydb"
npm start -- --transport http --port 3000
npm start -- --config ./my-config.yaml
npm start -- --log-level debug
npm start -- --print-config       # print resolved config (DSNs masked)
npm start -- --validate-config    # validate config and exit
npm start -- --version
```

### Using in Another Project

**`npm link`** (local development):

```bash
# Register globally from this project
npm run build && npm link

# Link in your consuming project
cd /path/to/your-project
npm link mysql-mcp-server

# Binary is now available
mysql-mcp-server --version
```

**Local path install:**

```bash
npm install /absolute/path/to/mysql-mcp-server-ts
npx mysql-mcp-server --version
```

See [docs/INTEGRATION.md](docs/INTEGRATION.md) for full integration instructions for all AI clients.

---

## Integration with AI Clients

After building, point any MCP client at `dist/index.js`. A minimal config block (the same pattern works for Claude, VS Code, Cursor, Continue, and Codex):

```json
{
  "command": "node",
  "args": ["/absolute/path/to/mysql-mcp-server-ts/dist/index.js"],
  "env": {
    "MYSQL_DSN": "mysql://user:password@localhost:3306/mydb",
    "MYSQL_MCP_EXTENDED": "true"
  }
}
```

| Client | Config file |
|--------|------------|
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Claude Code** | `.mcp.json` in project root, or `claude mcp add` |
| **VS Code / Copilot** | User Settings JSON or `.vscode/mcp.json` |
| **Cursor** | Cursor Settings → MCP |
| **Continue** | `~/.continue/config.yaml` |
| **Codex CLI** | `~/.codex/config.yaml` |

See [docs/INTEGRATION.md](docs/INTEGRATION.md) for platform-specific steps, `npm link` setup, and advanced configuration.

---

## Tools (28 total)

The first **12 tools** are always available. The remaining **16 extended tools** require `MYSQL_MCP_EXTENDED=true`.

**Core (6):** `ping`, `server_info`, `list_databases`, `list_tables`, `describe_table`, `run_query`

**Schema (4):** `list_schemas`, `use_schema`, `describe_schema`, `schema_search`

**Connection (2):** `list_connections`, `use_connection`

**Extended (16):** `list_indexes`, `show_create_table`, `explain_query`, `list_views`, `list_triggers`, `list_procedures`, `show_create_procedure`, `call_procedure`, `compare_procedures`, `list_functions`, `list_partitions`, `database_size`, `table_size`, `foreign_keys`, `list_status`, `list_variables`

See [docs/TOOLS.md](docs/TOOLS.md) for inputs, outputs, and examples for every tool.

---

## Folder Structure

```
mysql-mcp-server-ts/
├── src/
│   ├── domain/               # Business rules — interfaces, validators, errors (no deps)
│   │   ├── interfaces/       # IDatabaseRepository, ISchemaRepository, ISqlValidator, ILogger
│   │   ├── validators/       # isReadOnlyStatement, isValidIdentifier, quoteIdentifier
│   │   └── errors.ts         # ValidationError, ConnectionError, QueryError, ConfigError
│   ├── application/
│   │   └── services/         # Use-case services: DatabaseService, SchemaService, QueryService
│   ├── infrastructure/       # External adapters (depend on domain interfaces)
│   │   ├── config/           # env.ts (parse MYSQL_* vars), loader.ts (merge sources)
│   │   ├── database/mysql/   # MySqlAdapter (mysql2), MySqlRepository, parseDsn
│   │   ├── logging/          # WinstonLogger, FileAuditLogger
│   │   ├── security/         # AstSqlValidator, RegexSqlValidator, CompositeSqlValidator
│   │   ├── transport/        # StdioTransport (MCP SDK), HttpTransport (Express)
│   │   └── tunnel/           # SshTunnel (ssh2)
│   ├── interface/
│   │   ├── tools/            # 28 tool files + ToolRegistry
│   │   ├── http/             # Express server, rate limiter, API key middleware
│   │   └── cli/              # CLI argument parser (--dsn, --transport, --config …)
│   ├── shared/
│   │   ├── config.ts         # AppConfig, ConnectionConfig, FeatureFlags (TypeScript interfaces)
│   │   └── constants.ts      # DEFAULT_MAX_ROWS, VERSION, SYSTEM_SCHEMAS …
│   └── index.ts              # Composition root — wires all layers, starts transport
├── tests/
│   ├── mocks/                # Shared mock implementations for all interfaces
│   ├── unit/                 # 117 unit tests (validators, services, config, registry)
│   └── integration/          # Real MySQL connectivity tests
├── docs/                     # Full documentation
├── dist/                     # Compiled output (generated by npm run build)
├── .env.example              # All environment variables with descriptions
├── package.json
└── tsconfig.json
```

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Setup](docs/SETUP.md) | Installation, first run, build explanation, npm link |
| [Configuration](docs/CONFIGURATION.md) | All env vars, CLI args, YAML/JSON config, SSH, SSL |
| [Tools Reference](docs/TOOLS.md) | All 28 tools — inputs, outputs, examples |
| [Integration](docs/INTEGRATION.md) | Claude, VS Code, Codex, Cursor, npm link, local install |
| [REST API](docs/REST-API.md) | HTTP endpoints, curl examples, Postman collection |
| [Architecture](docs/ARCHITECTURE.md) | Clean Architecture layers, dependency flow |
| [Security](docs/SECURITY.md) | SQL validation pipeline, blocked patterns |
| [Testing](docs/TESTING.md) | Unit tests, integration tests |
| [Contributing](docs/CONTRIBUTING.md) | Dev setup, code style, adding tools, PR guidelines |

---

## License

MIT

