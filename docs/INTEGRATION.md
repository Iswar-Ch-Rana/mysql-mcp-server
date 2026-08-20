# Integration Guide

This guide explains how to add the MySQL MCP Server to AI clients (Claude, VS Code, Codex, Cursor) and how to consume the built package in another Node.js project.

## Before You Start: credentials live in `.env`

Every config block below is deliberately short — **no `env` block, no credentials.**

Set your connection once in `.env` in the repo root (see [Setup](SETUP.md)). The server
resolves that file from its own install directory, so it finds the same credentials no
matter which client launches it or from what working directory. `.env` is loaded with
`override`, which means a client `env` block **cannot** change a variable `.env` defines
— it is silently ignored. Putting credentials in two places is what makes MCP servers
mysteriously connect to the wrong database; keep them in `.env` only.

Before wiring up any client, confirm the server works standalone:

```bash
npm run build
node dist/index.js --print-config   # resolved config, password masked
```

---

## Using this Package in Another Project

The server is a CLI binary that runs as a subprocess. You can reference it from any project in two ways.

### Option A — `npm link` (local development)

Use this when you are developing the server locally and want to reference it from another project without publishing.

```bash
# 1. Build and register the binary globally
cd mysql-mcp-server-ts
npm install
npm run build
npm link

# 2. In the consuming project, link to it
cd /path/to/your-project
npm link mysql-mcp-server

# 3. The binary is now available
mysql-mcp-server --version
```

Unlink when done:
```bash
npm unlink mysql-mcp-server        # in consuming project
npm unlink -g mysql-mcp-server     # remove global symlink
```

### Option B — Local path install

Install directly from the cloned folder:

```bash
npm install /absolute/path/to/mysql-mcp-server-ts
```

After install, call the binary via `npx`:

```bash
npx mysql-mcp-server --version
```

Or reference the binary path directly in config files:

```
./node_modules/.bin/mysql-mcp-server
```

### What `npm run build` Produces

`npm run build` runs `tsc` and outputs compiled JavaScript to `./dist/`:

```
dist/
  index.js          ← entry point / CLI binary
  index.d.ts        ← TypeScript declarations
  application/      ← compiled use-case services
  domain/           ← compiled interfaces & validators
  infrastructure/   ← compiled adapters (MySQL, SSH, config, logging)
  interface/        ← compiled tools, HTTP server, CLI parser
  shared/           ← compiled config types & constants
```

The `bin` field in `package.json` maps `mysql-mcp-server` → `dist/index.js`. After `npm link` or `npm install`, the binary is available as `mysql-mcp-server` on the PATH.

---

## Claude

### Claude Desktop

Locate your Claude Desktop config file:

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

Add the server:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/absolute/path/to/mysql-mcp-server/dist/index.js"],
      "cwd": "/absolute/path/to/mysql-mcp-server"
    }
  }
}
```

If you used `npm link`, you can use the binary name instead:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "mysql-mcp-server",
      "args": []
    }
  }
}
```

Restart Claude Desktop after saving. Look for the hammer (🔨) icon in the chat input area — that confirms the tools are loaded.

### Claude Code (CLI)

**Option 1 — `.mcp.json` in your project root:**

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/absolute/path/to/mysql-mcp-server/dist/index.js"],
      "cwd": "/absolute/path/to/mysql-mcp-server"
    }
  }
}
```

**Option 2 — via the CLI:**

```bash
claude mcp add mysql node /path/to/mysql-mcp-server/dist/index.js
```

**Usage:**

```
claude> "List all tables in the users database"
claude> "Describe the orders table schema"
claude> "How many active users were created this year?"
```

---

## VS Code

### GitHub Copilot (Agent Mode)

**User-level config** (`Ctrl+Shift+P` → "Preferences: Open User Settings (JSON)"):

```json
{
  "mcp": {
    "servers": {
      "mysql": {
        "command": "node",
        "args": ["/absolute/path/to/mysql-mcp-server/dist/index.js"],
        "cwd": "/absolute/path/to/mysql-mcp-server"
      }
    }
  }
}
```

**Workspace-level config** — create `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "mysql": {
      "command": "node",
      "args": ["/absolute/path/to/mysql-mcp-server/dist/index.js"],
      "cwd": "/absolute/path/to/mysql-mcp-server"
    }
  }
}
```

Open Copilot Chat (`Ctrl+Shift+I`), switch to **Agent** mode, then ask database questions — Copilot calls the tools automatically.

### Continue Extension

Edit `~/.continue/config.yaml`:

```yaml
mcpServers:
  - name: mysql
    command: node
    args:
      - /absolute/path/to/mysql-mcp-server/dist/index.js
```

### Cursor

In Cursor Settings → MCP:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/absolute/path/to/mysql-mcp-server/dist/index.js"],
      "cwd": "/absolute/path/to/mysql-mcp-server"
    }
  }
}
```

Open Cursor Composer (`Ctrl+I`) and ask database questions directly.

---

## OpenAI Codex CLI

Edit `~/.codex/config.yaml`:

```yaml
mcp_servers:
  mysql:
    command: node
    args:
      - /absolute/path/to/mysql-mcp-server/dist/index.js
```

**Usage:**

```bash
codex "List all tables in my database"
codex "Show the schema of the users table"
codex "What indexes exist on the orders table?"
codex "How many orders were placed last month?"
```

---

## Common Configuration Tips

### Always build first

All editor configs point to `dist/index.js` — the compiled output. Run `npm run build` before configuring any editor.

### Use absolute paths

Relative paths may not resolve correctly depending on how the editor launches the server process.

### Everything else goes in `.env`, not the client config

The three tips below are all `.env` edits. A client `env` block is ignored for any
variable `.env` defines, so that is the only place worth changing. Restart the editor
after editing `.env` — the server reads it once at startup.

### Extended tools

```env
MYSQL_MCP_EXTENDED=true
```

Unlocks the 11 extended tools — 22 total instead of 11. They are off by default to
reduce tool-list noise in smaller setups.

### Multiple databases

Define named connections and switch between them at runtime:

```env
MYSQL_CONNECTIONS={"default":{"dsn":"mysql://user:pass@localhost:3306/app"},"staging":{"dsn":"mysql://user:pass@staging-db:3306/app"}}
```

Use the `use_connection` tool to switch: `"Switch to the staging database"`.

Note that `MYSQL_CONNECTIONS` **replaces** the connection set — it does not add to the
`MYSQL_HOST`/`MYSQL_DSN` default. One entry **must** be named `default`, or startup
fails with `Missing required configuration: connections.default.dsn`.

### SSH tunneling

For databases behind a bastion host, point the connection at the internal host and add:

```env
MYSQL_MCP_SSH_HOST=bastion.example.com
MYSQL_MCP_SSH_USER=deploy
MYSQL_MCP_SSH_KEY_PATH=/home/user/.ssh/id_rsa
```

The server opens the tunnel and rewrites the DSN to the local forwarded port itself.

### Debugging

```env
MYSQL_MCP_LOG_LEVEL=debug          # verbose output
MYSQL_MCP_JSON_LOGS=true           # structured JSON logs
MYSQL_MCP_AUDIT_LOG=/tmp/mcp-audit.jsonl
```

Logs go to **stderr**, which is what MCP clients capture — stdout carries the protocol.
When a client reports the server failed to start, run it by hand first; that surfaces
the real error without the client swallowing it:

```bash
node /absolute/path/to/mysql-mcp-server/dist/index.js --print-config
```

After changing any MCP config, restart the editor or reload the window.
