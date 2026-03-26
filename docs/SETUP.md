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

### 1. Set the MySQL DSN

```bash
export MYSQL_DSN="mysql://user:password@localhost:3306/mydb"
```

DSN format: `mysql://[user]:[password]@[host]:[port]/[database]`

### 2. Run the Server

```bash
# MCP stdio mode (default)
npm start

# Or with the DSN inline
MYSQL_DSN="mysql://user:password@localhost:3306/mydb" npm start
```

### 3. Verify It Works

```bash
# HTTP mode with health check
MYSQL_DSN="mysql://user:password@localhost:3306/mydb" \
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

Create a `.env` file in the project root:

```env
MYSQL_DSN=mysql://user:password@localhost:3306/mydb
MYSQL_MCP_EXTENDED=true
MYSQL_MCP_AUDIT_LOG=./audit.jsonl
```

The server loads `.env` automatically via `dotenv`.

## Config File

You can also use a `config.yaml` or `config.json` file in the project root:

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
