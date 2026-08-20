# Setup Guide

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 9.x
- **MySQL** 5.7+ or 8.x (read access required)

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd mysql-mcp-server-ts

# Install dependencies
npm install

# Build the project
npm run build
```

## Quick Start

### 1. Create your `.env`

```bash
cp .env.example .env
```

Edit the connection block at the top — this is the only place the server reads
credentials from:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=user
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=mydb
```

Or use a single DSN instead of the five variables:

```env
MYSQL_DSN=mysql://user:password@localhost:3306/mydb
```

DSN format: `mysql://[user]:[password]@[host]:[port]/[database]`. Prefer the
individual variables when the password contains `#`, `@`, `/`, or `?` — they are
URL-encoded for you, so you do not have to escape anything.

> **Exported shell variables do not work.** `export MYSQL_DSN=...` and inline
> `MYSQL_DSN=... npm start` are both ignored — `.env` is loaded with `override`, so it
> wins over the environment. Use `--dsn` for a one-off connection (see step 3).

### 2. Verify the Config

```bash
npm start -- --print-config
```

This prints the fully resolved config with the password masked. Check the DSN line
before going further — if the host, port, user, or database is wrong, the fix is in
`.env`.

### 3. Run the Server

```bash
# MCP stdio mode (default)
npm start

# One-off connection to a different database, without touching .env
npm start -- --dsn "mysql://user:password@otherhost:3306/otherdb"
```

### 4. Verify It Works

```bash
npm start -- --transport http --port 3000

# In another terminal
curl http://localhost:3000/health
# => {"status":"ok"}
```

## Development Mode

Use `tsx` for live reloading during development:

```bash
npm run dev
```

## Environment File

`.env` lives in the repo root and is the single source of credentials:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=user
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=mydb

MYSQL_MCP_EXTENDED=true
MYSQL_MCP_AUDIT_LOG=./audit.jsonl
```

The server resolves this file from **its own install directory**, not from the current
working directory, so an MCP client can launch it from anywhere and still get the same
credentials. It is loaded with `override: true`, so it also wins over any variable the
client passes in its `env` block. `.env` is gitignored.

If the file is missing, the server prints a warning naming the path it looked for and
then falls back to whatever is in the ambient environment — so a client `env` block or
an exported variable still works when there is no `.env` at all. Once `.env` exists, it
takes over for every variable it defines.

## Config File

A `config.yaml` or `config.json` in the **launch directory** is merged in *underneath*
`.env` — it cannot override a credential `.env` sets, but it does supply anything `.env`
leaves unset:

```yaml
# config.yaml
connections:
  default:
    name: default
    dsn: mysql://user:password@localhost:3306/mydb

query:
  maxRows: 500
  timeoutSeconds: 60

features:
  extendedTools: true

logging:
  level: debug
  auditLogPath: ./audit.jsonl
```

See [Configuration](CONFIGURATION.md) for all options.

## CLI Arguments

```bash
npm start -- --dsn "mysql://user:password@localhost:3306/mydb"
npm start -- --transport http --port 3000
npm start -- --config ./my-config.yaml
npm start -- --log-level debug
npm start -- --silent
npm start -- --version
npm start -- --print-config
npm start -- --validate-config
```

## What the Build Generates

`npm run build` compiles TypeScript to `./dist/` using the settings in `tsconfig.json`:

```
dist/
  index.js          ← entry point; also registered as the "mysql-mcp-server" CLI binary
  index.d.ts        ← TypeScript declarations for library consumers
  application/      ← compiled use-case services
  domain/           ← compiled interfaces, validators, error types
  infrastructure/   ← compiled adapters (MySQL, SSH, config, logging)
  interface/        ← compiled tools, HTTP server, CLI parser
  shared/           ← compiled config types and constants
```

The binary defined in `package.json` (`"bin": {"mysql-mcp-server": "./dist/index.js"}`) is what `npm start` runs and what `npm link` exposes on the PATH.

## Using this Package in Another Project

### Via `npm link` (recommended for local development)

```bash
# 1. In this project: build and register the binary globally
cd mysql-mcp-server-ts
npm run build
npm link

# 2. In your consuming project: link to it
cd /path/to/your-project
npm link mysql-mcp-server

# 3. The binary is now available in that project
mysql-mcp-server --version

# Unlink when done
npm unlink mysql-mcp-server          # in the consuming project
npm unlink -g mysql-mcp-server       # remove the global symlink
```

### Via local path install

```bash
npm install /absolute/path/to/mysql-mcp-server-ts
```

Then call the binary via `npx`:

```bash
npx mysql-mcp-server --dsn "mysql://user:pass@localhost:3306/mydb" --transport http
```

Or reference it directly in editor / CI configs:

```
./node_modules/.bin/mysql-mcp-server
```

See [Integration Guide](INTEGRATION.md) for step-by-step instructions for Claude, VS Code, Codex, and Cursor.

## Verify the Build

```bash
# Type check
npx tsc --noEmit

# Run tests
npm test

# Lint
npm run lint
```

## Troubleshooting

### Connection refused

- Verify MySQL is running: `mysql -u user -p -h localhost -P 3306`
- Check the DSN format — it must start with `mysql://`
- Confirm the MySQL user has SELECT privileges

### Build errors

- Ensure Node.js >= 20: `node --version`
- Clear and reinstall: `rm -rf node_modules dist && npm install && npm run build`

### Permission denied

- The server only requires SELECT, SHOW, DESCRIBE, EXPLAIN privileges
- Grant minimal permissions: `GRANT SELECT ON mydb.* TO 'mcp_user'@'%';`
