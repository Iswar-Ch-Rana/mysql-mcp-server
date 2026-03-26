# Configuration

The server resolves configuration from multiple sources with the following priority (highest first):

1. **CLI arguments** (`--dsn`, `--port`, etc.)
2. **Environment variables** (`MYSQL_DSN`, etc.)
3. **Config file** (`config.yaml`, `config.yml`, or `config.json`)
4. **Built-in defaults**

## Environment Variables

### Connection

| Variable | Description | Example |
|----------|-------------|---------|
| `MYSQL_DSN` | Default MySQL connection string | `mysql://user:pass@host:3306/db` |
| `MYSQL_CONNECTIONS` | JSON object with named connections | `{"staging":{"dsn":"mysql://..."}}` |

### Query

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_MAX_ROWS` | Maximum rows returned per query | `200` |
| `MYSQL_MCP_QUERY_TIMEOUT` | Query timeout in seconds | `30` |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_MCP_EXTENDED` | Enable 16 extended tools | `false` |

### Logging

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_MCP_JSON_LOGS` | Output logs as JSON | `false` |
| `MYSQL_MCP_AUDIT_LOG` | Path to JSONL audit log file | (disabled) |
| `MYSQL_MCP_SILENT` | Suppress all log output | `false` |

### HTTP Transport

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_MCP_HTTP` | Enable HTTP transport | `false` |
| `MYSQL_MCP_HTTP_PORT` | HTTP server port | `3000` |
| `MYSQL_MCP_API_KEY` | API key for HTTP auth | (disabled) |
| `MYSQL_MCP_RATE_LIMIT_ENABLED` | Enable rate limiting | `false` |
| `MYSQL_MCP_RATE_LIMIT_RPS` | Requests per second limit | `10` |
| `MYSQL_MCP_RATE_LIMIT_BURST` | Burst request limit | `20` |

### SSH Tunnel

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_MCP_SSH_HOST` | SSH bastion host | (disabled) |
| `MYSQL_MCP_SSH_PORT` | SSH port | `22` |
| `MYSQL_MCP_SSH_USER` | SSH username | |
| `MYSQL_MCP_SSH_KEY_PATH` | Path to SSH private key | |

### SSL

SSL is configured via the config file. See the Config File section below.

## CLI Arguments

| Argument | Short | Description |
|----------|-------|-------------|
| `--dsn <url>` | | Override default DSN |
| `--port <n>` | | Set HTTP port (enables HTTP mode) |
| `--transport <mode>` | | `stdio` (default) or `http` |
| `--config <path>` | `-c` | Path to config file |
| `--log-level <level>` | | `debug`, `info`, `warn`, `error` |
| `--silent` | `-s` | Suppress log output |
| `--daemon` | `-d` | Run in background |
| `--version` | `-v` | Print version and exit |
| `--print-config` | | Print resolved config (DSNs masked) and exit |
| `--validate-config` | | Validate config and exit |

## Config File

The server looks for config files in this order:

1. Path specified by `--config` / `-c`
2. `config.yaml` in the working directory
3. `config.yml` in the working directory
4. `config.json` in the working directory

### Full Config Example (YAML)

```yaml
connections:
  default:
    name: default
    dsn: mysql://root:password@localhost:3306/production
  staging:
    name: staging
    dsn: mysql://readonly:pass@staging-db:3306/app

pool:
  maxOpen: 10
  maxIdle: 5
  maxLifetimeSeconds: 300

query:
  maxRows: 200
  timeoutSeconds: 30

http:
  enabled: false
  port: 3000
  host: 127.0.0.1
  apiKey: ""
  rateLimitEnabled: false
  rateLimitRps: 10
  rateLimitBurst: 20

ssh:
  host: ""
  port: 22
  user: ""
  keyPath: ""

ssl:
  mode: disabled     # disabled | preferred | required
  ca: ""             # Path to CA certificate
  cert: ""           # Path to client certificate
  key: ""            # Path to client key

logging:
  level: info        # debug | info | warn | error
  silent: false
  jsonLogs: false
  auditLogPath: ""

schemas:
  exclude: []        # Schemas to hide (e.g., ["internal", "temp"])
  include: []        # If set, ONLY these schemas are visible

features:
  extendedTools: false
  tokenTracking: false
```

### Full Config Example (JSON)

```json
{
  "connections": {
    "default": {
      "name": "default",
      "dsn": "mysql://root:password@localhost:3306/production"
    }
  },
  "pool": {
    "maxOpen": 10,
    "maxIdle": 5,
    "maxLifetimeSeconds": 300
  },
  "query": {
    "maxRows": 200,
    "timeoutSeconds": 30
  },
  "features": {
    "extendedTools": false,
    "tokenTracking": false
  }
}
```

## Connection Pool

| Setting | Default | Description |
|---------|---------|-------------|
| `pool.maxOpen` | `10` | Maximum open connections |
| `pool.maxIdle` | `5` | Maximum idle connections |
| `pool.maxLifetimeSeconds` | `300` | Max connection lifetime (5 min) |

## Schema Filtering

Control which schemas are visible to the AI client:

```yaml
schemas:
  exclude:
    - internal
    - temp_data
```

Or allowlist specific schemas:

```yaml
schemas:
  include:
    - production
    - analytics
```

System schemas (`information_schema`, `performance_schema`, `mysql`, `sys`) are always excluded by default.

## SSH Tunneling

Connect to MySQL through an SSH bastion host:

```bash
MYSQL_DSN="mysql://dbuser:dbpass@remote-db:3306/mydb" \
MYSQL_MCP_SSH_HOST="bastion.example.com" \
MYSQL_MCP_SSH_USER="deploy" \
MYSQL_MCP_SSH_KEY_PATH="~/.ssh/id_rsa" \
npm start
```

The server opens a local port, tunnels traffic through SSH, and rewrites the DSN to `127.0.0.1:<localPort>`.

## Multi-Connection Setup

Define multiple named connections and switch between them at runtime:

```bash
export MYSQL_DSN="mysql://user:pass@prod-db:3306/app"
export MYSQL_CONNECTIONS='{"staging":{"dsn":"mysql://user:pass@staging-db:3306/app"},"analytics":{"dsn":"mysql://user:pass@analytics-db:3306/warehouse"}}'
```

Use the `use_connection` tool to switch between connections during a session.
