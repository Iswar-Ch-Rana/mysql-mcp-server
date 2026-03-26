# Tools Reference

The server provides 28 database tools organized into four groups.

- **Core** (6 tools) — Always available
- **Schema** (4 tools) — Always available
- **Connection** (2 tools) — Always available
- **Extended** (16 tools) — Requires `MYSQL_MCP_EXTENDED=true`

---

## Core Tools (6)

### `list_databases`

List all accessible databases/schemas on the MySQL server.

**Inputs:** None

**Example:**
```json
{"name": "list_databases", "arguments": {}}
```

---

### `list_tables`

List all tables in a schema/database.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes | Schema/database name |

**Example:**
```json
{"name": "list_tables", "arguments": {"schema": "mydb"}}
```

---

### `describe_table`

Describe the columns of a table.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes | Schema/database name |
| `table` | string | Yes | Table name |

**Example:**
```json
{"name": "describe_table", "arguments": {"schema": "mydb", "table": "users"}}
```

---

### `run_query`

Execute a read-only SQL query (SELECT, SHOW, DESCRIBE, EXPLAIN).

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | SQL SELECT/SHOW/DESCRIBE/EXPLAIN query |
| `schema` | string | No | Schema context |
| `max_rows` | number | No | Max rows to return (default: 200) |

**Example:**
```json
{"name": "run_query", "arguments": {"query": "SELECT * FROM users LIMIT 10", "schema": "mydb"}}
```

---

### `ping`

Ping the MySQL server to check connectivity.

**Inputs:** None

**Example:**
```json
{"name": "ping", "arguments": {}}
```

---

### `server_info`

Get MySQL server information (version, uptime, current user, etc.).

**Inputs:** None

**Example:**
```json
{"name": "server_info", "arguments": {}}
```

---

## Schema Tools (4)

### `list_schemas`

List all schemas/databases with metadata.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `filter` | string | No | Filter pattern |

**Example:**
```json
{"name": "list_schemas", "arguments": {}}
{"name": "list_schemas", "arguments": {"filter": "prod"}}
```

---

### `use_schema`

Switch the active schema/database context.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes | Schema name to switch to |

**Example:**
```json
{"name": "use_schema", "arguments": {"schema": "production"}}
```

---

### `describe_schema`

Get a comprehensive overview of a schema (tables, views, procedures, functions).

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes | Schema/database name |

**Example:**
```json
{"name": "describe_schema", "arguments": {"schema": "mydb"}}
```

---

### `schema_search`

Search for database objects by name across schemas.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Object name to search for |
| `type` | string | No | Object type filter: `table`, `view`, `procedure`, or `function` |

**Example:**
```json
{"name": "schema_search", "arguments": {"name": "user"}}
{"name": "schema_search", "arguments": {"name": "order", "type": "table"}}
```

---

## Connection Tools (2)

### `list_connections`

List all configured database connections.

**Inputs:** None

**Example:**
```json
{"name": "list_connections", "arguments": {}}
```

---

### `use_connection`

Switch to a different database connection.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Connection name |

**Example:**
```json
{"name": "use_connection", "arguments": {"name": "staging"}}
```

---

## Extended Tools (13)

> These tools require `MYSQL_MCP_EXTENDED=true` to be enabled.

### `list_indexes`

List all indexes on a table.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes | Schema/database name |
| `table` | string | Yes | Table name |

**Example:**
```json
{"name": "list_indexes", "arguments": {"schema": "mydb", "table": "users"}}
```

---

### `show_create_table`

Show the CREATE TABLE DDL statement for a table.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes | Schema/database name |
| `table` | string | Yes | Table name |

**Example:**
```json
{"name": "show_create_table", "arguments": {"schema": "mydb", "table": "orders"}}
```

---

### `explain_query`

Show the execution plan for a SQL query.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | SQL query to explain |

**Example:**
```json
{"name": "explain_query", "arguments": {"query": "SELECT * FROM users WHERE email = 'test@example.com'"}}
```

---

### `list_views`

List all views in a schema.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes | Schema/database name |

**Example:**
```json
{"name": "list_views", "arguments": {"schema": "mydb"}}
```

---

### `list_triggers`

List all triggers in a schema.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes | Schema/database name |

**Example:**
```json
{"name": "list_triggers", "arguments": {"schema": "mydb"}}
```

---

### `list_procedures`

List all stored procedures in a schema.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes | Schema/database name |

**Example:**
```json
{"name": "list_procedures", "arguments": {"schema": "mydb"}}
```

---

### `list_functions`

List all stored functions in a schema.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes | Schema/database name |

**Example:**
```json
{"name": "list_functions", "arguments": {"schema": "mydb"}}
```

---

### `list_partitions`

List all partitions on a table.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes | Schema/database name |
| `table` | string | Yes | Table name |

**Example:**
```json
{"name": "list_partitions", "arguments": {"schema": "mydb", "table": "events"}}
```

---

### `database_size`

Get the size of a database or all databases.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `database` | string | No | Database name (omit for all) |

**Example:**
```json
{"name": "database_size", "arguments": {}}
{"name": "database_size", "arguments": {"database": "mydb"}}
```

---

### `table_size`

Get the size of tables in a schema.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes | Schema/database name |
| `table` | string | No | Table name (omit for all tables) |

**Example:**
```json
{"name": "table_size", "arguments": {"schema": "mydb"}}
{"name": "table_size", "arguments": {"schema": "mydb", "table": "users"}}
```

---

### `foreign_keys`

List all foreign keys on a table.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | string | Yes | Schema/database name |
| `table` | string | Yes | Table name |

**Example:**
```json
{"name": "foreign_keys", "arguments": {"schema": "mydb", "table": "orders"}}
```

---

### `list_status`

List MySQL server status variables.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `filter` | string | No | Filter pattern for status variables |

**Example:**
```json
{"name": "list_status", "arguments": {}}
{"name": "list_status", "arguments": {"filter": "Threads"}}
```

---

### `list_variables`

List MySQL server configuration variables.

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `filter` | string | No | Filter pattern for variables |

**Example:**
```json
{"name": "list_variables", "arguments": {}}
{"name": "list_variables", "arguments": {"filter": "max_connections"}}
```

---

## Summary Table

| # | Tool | Group | Inputs |
|---|------|-------|--------|
| 1 | `list_databases` | core | — |
| 2 | `list_tables` | core | `schema` |
| 3 | `describe_table` | core | `schema`, `table` |
| 4 | `run_query` | core | `query`, `schema?`, `max_rows?` |
| 5 | `ping` | core | — |
| 6 | `server_info` | core | — |
| 7 | `list_schemas` | schema | `filter?` |
| 8 | `use_schema` | schema | `schema` |
| 9 | `describe_schema` | schema | `schema` |
| 10 | `schema_search` | schema | `name`, `type?` |
| 11 | `list_connections` | connection | — |
| 12 | `use_connection` | connection | `name` |
| 13 | `list_indexes` | extended | `schema`, `table` |
| 14 | `show_create_table` | extended | `schema`, `table` |
| 15 | `explain_query` | extended | `query` |
| 16 | `list_views` | extended | `schema` |
| 17 | `list_triggers` | extended | `schema` |
| 18 | `list_procedures` | extended | `schema` |
| 19 | `list_functions` | extended | `schema` |
| 20 | `list_partitions` | extended | `schema`, `table` |
| 21 | `database_size` | extended | `database?` |
| 22 | `table_size` | extended | `schema`, `table?` |
| 23 | `foreign_keys` | extended | `schema`, `table` |
| 24 | `list_status` | extended | `filter?` |
| 25 | `list_variables` | extended | `filter?` |

`?` = optional parameter
