# Security

## Read-Only by Design

The server is fundamentally read-only. Every SQL query passes through a dual-layer validation pipeline before execution. Only the following statement types are allowed:

- `SELECT`
- `SHOW`
- `DESCRIBE` / `DESC`
- `EXPLAIN`
- `USE`

All other statements (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `CREATE`, `ALTER`, `GRANT`, `TRUNCATE`, etc.) are rejected before reaching the database.

## SQL Validation Pipeline

Every query passes through two independent validators in sequence. If either rejects the query, execution is blocked.

```
User Query
    │
    ▼
┌──────────────────┐
│  AST Validator   │  ← Parses SQL into Abstract Syntax Tree
│  (node-sql-parser)│
└─────────┬────────┘
          │ pass
          ▼
┌──────────────────┐
│  Regex Validator │  ← Pattern-based checks for injection
│  (fallback layer)│
└─────────┬────────┘
          │ pass
          ▼
    Execute Query
```

### Layer 1: AST Validator (`AstSqlValidator`)

Uses `node-sql-parser` to parse SQL into an abstract syntax tree.

**Checks:**
- Statement type must be in allowed set (`select`, `show`, `desc`, `explain`, `use`)
- Walks the entire AST tree to detect dangerous function calls
- Blocks: `SLEEP()`, `BENCHMARK()`, `LOAD_FILE()`, `SYS_EXEC()`, `SYS_EVAL()`, `SYS_GET()`
- If the SQL cannot be parsed, it is rejected

### Layer 2: Regex Validator (`RegexSqlValidator`)

Pattern-based validation as a defense-in-depth fallback.

**Checks:**
- Statement starts with an allowed keyword
- No multiple statements (blocks stacked queries)
- No dangerous patterns (system functions, time-based attacks)
- No `UNION` combined with `information_schema` probing
- No embedded semicolons (stacked query injection)
- No SQL comments (`--`, `/* */`) to prevent comment-based injection

### Domain Validators

Core validation functions used by the regex layer:

| Function | Purpose |
|----------|---------|
| `isReadOnlyStatement(sql)` | Checks first keyword is SELECT/SHOW/DESCRIBE/EXPLAIN/USE |
| `hasMultipleStatements(sql)` | Detects stacked queries via semicolons |
| `containsDangerousPatterns(sql)` | Matches against known dangerous function patterns |
| `stripStringLiterals(sql)` | Removes string content to prevent false positives |

## What Is Blocked

### Blocked Statement Types

```sql
-- All blocked:
INSERT INTO users VALUES (...)
UPDATE users SET name = 'x'
DELETE FROM users
DROP TABLE users
CREATE TABLE hack (...)
ALTER TABLE users ADD COLUMN ...
TRUNCATE TABLE users
GRANT ALL ON *.* TO ...
REVOKE SELECT ON ...
RENAME TABLE users TO users2
LOAD DATA INFILE ...
```

### Blocked Injection Patterns

```sql
-- Stacked queries
SELECT 1; DROP TABLE users

-- UNION + information_schema probing
SELECT 1 UNION SELECT table_name FROM information_schema.tables

-- Time-based attacks
SELECT SLEEP(10)
SELECT BENCHMARK(1000000, SHA1('test'))

-- Dangerous functions
SELECT LOAD_FILE('/etc/passwd')
SELECT SYS_EXEC('rm -rf /')

-- Comment injection
SELECT * FROM users -- WHERE admin=1
SELECT * FROM users /* injected */
```

### Allowed Queries

```sql
-- All allowed:
SELECT * FROM users WHERE id = 1
SELECT count(*) FROM orders
SHOW DATABASES
SHOW TABLES
SHOW CREATE TABLE users
DESCRIBE users
DESC users
EXPLAIN SELECT * FROM users
USE mydb
SELECT * FROM users LIMIT 10
```

## Query Limits

| Limit | Default | Config |
|-------|---------|--------|
| Max rows returned | 200 | `MYSQL_MAX_ROWS` |
| Query timeout | 30 seconds | `MYSQL_MCP_QUERY_TIMEOUT` |
| Max request body | 1 MB | Constant (`MAX_REQUEST_BODY_BYTES`) |

## HTTP Security

When running in HTTP mode, the server provides:

### API Key Authentication

Requests must include `Authorization: Bearer <key>` when `MYSQL_MCP_API_KEY` is set:

```bash
MYSQL_MCP_API_KEY="my-secret-key" npm start -- --transport http
```

Unauthorized requests receive HTTP 401.

### Rate Limiting

Prevent abuse with configurable rate limits:

```bash
MYSQL_MCP_RATE_LIMIT_ENABLED=true
MYSQL_MCP_RATE_LIMIT_RPS=10     # Requests per second
MYSQL_MCP_RATE_LIMIT_BURST=20   # Burst capacity
```

Excess requests receive HTTP 429.

### Request Size Limit

Request bodies are limited to 1 MB (`MAX_REQUEST_BODY_BYTES = 1_048_576`).

## Audit Logging

All executed queries can be logged to a JSONL audit file:

```bash
MYSQL_MCP_AUDIT_LOG=./audit.jsonl npm start
```

Each log entry includes:
- Timestamp
- SQL query text
- Execution duration
- Row count
- Error (if any)

Example audit entry:

```json
{"timestamp":"2024-06-15T10:30:00.000Z","sql":"SELECT count(*) FROM users","durationMs":12,"rowCount":1}
```

## Schema Filtering

Control which schemas are exposed to AI clients:

```yaml
schemas:
  exclude:
    - internal_admin
    - temp_data
  include:
    - production
    - analytics
```

System schemas are always hidden: `information_schema`, `performance_schema`, `mysql`, `sys`.

## Minimal Privileges

The MySQL user should have minimal privileges:

```sql
-- Recommended: SELECT only on specific databases
CREATE USER 'mcp_readonly'@'%' IDENTIFIED BY 'password';
GRANT SELECT ON mydb.* TO 'mcp_readonly'@'%';
FLUSH PRIVILEGES;
```

The server does not require `INSERT`, `UPDATE`, `DELETE`, `CREATE`, or any administrative privileges.

## SSH Tunneling

For databases not directly accessible, use SSH tunneling:

```bash
MYSQL_MCP_SSH_HOST=bastion.example.com
MYSQL_MCP_SSH_USER=deploy
MYSQL_MCP_SSH_KEY_PATH=~/.ssh/id_rsa
```

Traffic is encrypted through the SSH tunnel. The server opens a local port and rewrites the DSN to route through the tunnel.
