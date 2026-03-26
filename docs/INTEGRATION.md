# Integration Guide

This guide explains how to add the MySQL MCP Server to AI clients (Claude, VS Code, Codex, Cursor) and how to consume the built package in another Node.js project.

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
      "args": ["/absolute/path/to/mysql-mcp-server-ts/dist/index.js"],
      "env": {
        "MYSQL_DSN": "mysql://user:password@localhost:3306/mydb",
        "MYSQL_MCP_EXTENDED": "true"
      }
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
      "args": [],
      "env": {
        "MYSQL_DSN": "mysql://user:password@localhost:3306/mydb",
        "MYSQL_MCP_EXTENDED": "true"
      }
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
      "args": ["/absolute/path/to/mysql-mcp-server-ts/dist/index.js"],
      "env": {
        "MYSQL_DSN": "mysql://user:password@localhost:3306/mydb",
        "MYSQL_MCP_EXTENDED": "true"
      }
    }
  }
}
```

**Option 2 — via the CLI:**

```bash
claude mcp add mysql node /path/to/mysql-mcp-server-ts/dist/index.js \
  -e MYSQL_DSN="mysql://user:password@localhost:3306/mydb" \
  -e MYSQL_MCP_EXTENDED="true"
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
        "args": ["/absolute/path/to/mysql-mcp-server-ts/dist/index.js"],
        "env": {
          "MYSQL_DSN": "mysql://user:password@localhost:3306/mydb",
          "MYSQL_MCP_EXTENDED": "true"
        }
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
      "args": ["/absolute/path/to/mysql-mcp-server-ts/dist/index.js"],
      "env": {
        "MYSQL_DSN": "mysql://user:password@localhost:3306/mydb",
        "MYSQL_MCP_EXTENDED": "true"
      }
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
      - /absolute/path/to/mysql-mcp-server-ts/dist/index.js
    env:
      MYSQL_DSN: mysql://user:password@localhost:3306/mydb
      MYSQL_MCP_EXTENDED: "true"
```

### Cursor

In Cursor Settings → MCP:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/absolute/path/to/mysql-mcp-server-ts/dist/index.js"],
      "env": {
        "MYSQL_DSN": "mysql://user:password@localhost:3306/mydb",
        "MYSQL_MCP_EXTENDED": "true"
      }
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
      - /absolute/path/to/mysql-mcp-server-ts/dist/index.js
    env:
      MYSQL_DSN: mysql://user:password@localhost:3306/mydb
      MYSQL_MCP_EXTENDED: "true"
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

### Extended tools

Set `MYSQL_MCP_EXTENDED=true` in the `env` block to unlock all 28 tools (16 additional tools are disabled by default to reduce noise in smaller setups).

### Multiple databases

Define multiple named connections and switch between them at runtime:

```json
{
  "env": {
    "MYSQL_DSN": "mysql://user:pass@prod-db:3306/app",
    "MYSQL_CONNECTIONS": "{\"staging\":{\"dsn\":\"mysql://user:pass@staging-db:3306/app\"}}"
  }
}
```

Use the `use_connection` tool to switch: `"Switch to the staging database"`.

### SSH tunneling

For databases behind a bastion host, add SSH vars to the `env` block:

```json
{
  "env": {
    "MYSQL_DSN": "mysql://dbuser:dbpass@internal-db:3306/mydb",
    "MYSQL_MCP_SSH_HOST": "bastion.example.com",
    "MYSQL_MCP_SSH_USER": "deploy",
    "MYSQL_MCP_SSH_KEY_PATH": "/home/user/.ssh/id_rsa"
  }
}
```

### Debugging

- Add `"MYSQL_MCP_LOG_LEVEL": "debug"` to the `env` block for verbose output.
- Add `"MYSQL_MCP_JSON_LOGS": "true"` for structured JSON logs.
- Add `"MYSQL_MCP_AUDIT_LOG": "/tmp/mcp-audit.jsonl"` to record all queries.
- After changing any MCP config, restart the editor or reload the window.
