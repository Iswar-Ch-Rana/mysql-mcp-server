# MySQL MCP Server

A **read-only MySQL MCP (Model Context Protocol) server** built with TypeScript and Clean Architecture. Exposes a focused set of database tools to any MCP-compatible AI client — Claude Desktop, Claude Code, GitHub Copilot, Cursor, Codex CLI — over stdio or HTTP.

**Read-only by design.** The server cannot mutate the database. Schema and data changes happen through **migration files** that the LLM produces and the user applies via their existing pipeline (Flyway, `mysql < file.sql`, etc.). The MCP only measures, never deploys.

**Problem it solves:** AI assistants that need to reason about and tune a real database require a safe, structured interface with proper diagnostics — `EXPLAIN ANALYZE`, session profiling, slow-query digests, index health. This server provides that. It is *not* a generic SQL gateway; it is a senior-DBA toolkit for an LLM.

---

## Features

- **Read-only by design** — only `SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN` (incl. `ANALYZE` / `FORMAT=TREE|JSON`), `USE`, and `WITH` are permitted. `SET` is hard-coded server-side inside specific tools (e.g. `profile_query`); user input never reaches a `SET` statement.
- **Diagnostic-first toolset** — `explain_query` (with parsed bottleneck), `profile_query` (session profiling), `top_slow_queries` (perf-schema digest), `processlist`, `index_health` (unused + redundant indexes).
- **SQL injection protection** — dual-layer validation: AST parsing (`node-sql-parser`) + regex.
- **Multi-connection** — named connections, switch at runtime.
- **Dual transport** — MCP stdio (default) or HTTP REST API.
- **SSH tunneling** — connect through bastion hosts.
- **Audit logging** — JSONL audit trail for every executed query.
- **Schema filtering** — include/exclude schemas the AI client can see.
- **Config layering** — CLI args > env vars > YAML/JSON > built-in defaults.

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
cd mysql-mcp-server
npm install

# 2. Set your credentials — edit the connection block at the top of .env
cp .env.example .env
${EDITOR:-nano} .env

# 3. Build
npm run build

# 4. Check the config the server actually resolved (password masked)
node dist/index.js --print-config

# 5. Run (stdio/MCP mode)
npm start
```

Step 4 is the one to trust: it prints the DSN the server will really use. If the
host, port, user, or database is not what you expect, fix `.env` — nothing else
supplies credentials.

To smoke-test over HTTP instead of MCP:

```bash
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
git clone <repo-url>
cd mysql-mcp-server
npm install
cp .env.example .env
```

**Set your credentials in `.env`.** This file, in the repo root, is the only place
the server reads credentials from. Fill in the connection block that `.env.example`
already provides:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=user
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=mydb
```

Or replace that block with a single DSN, if your password has no special characters:

```env
MYSQL_DSN=mysql://user:password@localhost:3306/mydb
```

Build, verify, run:

```bash
npm run build
node dist/index.js --print-config   # confirm the resolved DSN (password masked)
npm start
```

`.env` is gitignored, so your credentials never get committed.

#### Where credentials come from

The server resolves `.env` **from its own install directory**, not from the current
working directory — so it finds the same file no matter where an MCP client launches
it from. It loads with `override`, which means:

| Source | Effect |
|--------|--------|
| `--dsn` on the command line | **Overrides `.env`** — the one intentional escape hatch |
| `.env` in the repo root | The authority for every variable it defines |
| `env` block in an MCP client config | Ignored for any variable `.env` defines |
| `export MYSQL_DSN=...` in your shell | Ignored for any variable `.env` defines |
| `config.yaml` / `config.json` in the launch directory | Still supplies settings `.env` leaves unset |

This is deliberate: one file to change, and no silent disagreement between a client
config and `.env`. For a one-off connection to a different database without editing
`.env`, pass `--dsn`.

Note the last row — a `config.yaml` sitting in whatever directory the client launched
from is still merged in underneath `.env`. It cannot override your credentials, but it
can set things `.env` says nothing about (row limits, pool size). If you want no
ambiguity at all, keep those directories free of `config.yaml`.

---

## Environment Configuration

All configuration is in `.env` in the repo root. Copy `.env.example` — the connection block is live, everything else is commented out at its default. Full reference below.

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

After building, point any MCP client at `dist/index.js`. Credentials come from the
`.env` file **in the repo root** — the server resolves it from its own location, so the
client needs no `env` block and no particular working directory:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/mysql-mcp-server/dist/index.js"]
}
```

The same block works for Claude, VS Code, Cursor, Continue, and Codex. An `env` block
in the client config is **ignored** for any variable the repo `.env` also sets — this is
deliberate, so there is exactly one place to change a credential. Only `--dsn` on the
command line overrides `.env`.

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

## Tools

Core tools are always available. Extended tools require `MYSQL_MCP_EXTENDED=true`.

**Core (5):** `server_info`, `list_databases`, `list_tables`, `describe_table`, `run_query`

**Schema (4):** `list_schemas`, `use_schema`, `describe_schema`, `schema_search`

**Connection (2):** `list_connections`, `use_connection`

**Extended (11):**
- Diagnostics: `explain_query` (with `format: default|analyze|tree|json`), `profile_query`, `call_procedure`, `top_slow_queries`, `processlist`
- Schema introspection: `list_indexes`, `show_create_table`, `list_procedures`, `show_create_procedure`, `index_health`, `list_objects` (kind ∈ view, trigger, function, partition, status, variable)

### Workflow: read-only diagnostics, file-based migrations

The server **never** mutates the database. The intended workflow is:

1. The LLM uses these tools to **measure** — find the slow query (`top_slow_queries`), localise the cost (`profile_query`, `explain_query` with `format=analyze`), inspect indexes (`index_health`).
2. The LLM **proposes a fix as a file** — edits a Flyway-style migration (`R__*.sql` repeatable, `V__*.sql` versioned) using the host editor's file tools.
3. **You apply the file** with your normal deploy pipeline (Flyway, `mysql < file.sql`, etc.). The MCP is not in the loop here.
4. The LLM **verifies** by re-running the diagnostic tools.

This separation keeps mutations under your control while letting the LLM be effective at the diagnostic side.

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

