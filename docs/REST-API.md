# REST API

The server can run in HTTP mode, exposing a JSON-RPC API compatible with the MCP protocol.

## Starting the HTTP Server

```bash
# Via CLI argument
MYSQL_DSN="mysql://user:password@localhost:3306/mydb" \
  npm start -- --transport http --port 3000

# Via environment variables
MYSQL_MCP_HTTP=true \
MYSQL_MCP_HTTP_PORT=3000 \
MYSQL_DSN="mysql://user:password@localhost:3306/mydb" \
  npm start

# Via config file
# config.yaml:
#   http:
#     enabled: true
#     port: 3000
npm start
```

The server listens on `127.0.0.1:3000` by default.

## Endpoints

### Health Check

```
GET /health
```

**Response:**

```json
{"status": "ok"}
```

### MCP JSON-RPC

```
POST /mcp
Content-Type: application/json
```

All tool operations use the `/mcp` endpoint with a JSON-RPC style body.

## curl Examples

### List Available Tools

```bash
curl -s http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}' | jq
```

### List Databases

```bash
curl -s http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "list_databases",
      "arguments": {}
    }
  }' | jq
```

### List Tables

```bash
curl -s http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "list_tables",
      "arguments": {"schema": "mydb"}
    }
  }' | jq
```

### Describe a Table

```bash
curl -s http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "describe_table",
      "arguments": {"schema": "mydb", "table": "users"}
    }
  }' | jq
```

### Run a Query

```bash
curl -s http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "run_query",
      "arguments": {"sql": "SELECT * FROM users LIMIT 10"}
    }
  }' | jq
```

### Ping

```bash
curl -s http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "ping",
      "arguments": {}
    }
  }' | jq
```

### Server Info

```bash
curl -s http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "server_info",
      "arguments": {}
    }
  }' | jq
```

### Database Size (Extended)

```bash
curl -s http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "database_size",
      "arguments": {}
    }
  }' | jq
```

## Authentication

### API Key

Set an API key to protect the HTTP endpoint:

```bash
MYSQL_MCP_API_KEY="my-secret-key" npm start -- --transport http
```

Then include the key in requests:

```bash
curl -s http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my-secret-key" \
  -d '{"method": "tools/list"}'
```

## Rate Limiting

Enable rate limiting to prevent abuse:

```bash
MYSQL_MCP_RATE_LIMIT_ENABLED=true \
MYSQL_MCP_RATE_LIMIT_RPS=10 \
MYSQL_MCP_RATE_LIMIT_BURST=20 \
npm start -- --transport http
```

When the rate limit is exceeded, the server responds with HTTP 429.

## Postman Collection

### Import Steps

1. Open Postman
2. Click **Import** > **Raw text**
3. Paste the collection JSON below
4. Set the `baseUrl` variable to `http://localhost:3000`

### Collection JSON

```json
{
  "info": {
    "name": "MySQL MCP Server",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:3000"}
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "List Tools",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/mcp",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"method\": \"tools/list\"}"
        }
      }
    },
    {
      "name": "List Databases",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/mcp",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"method\": \"tools/call\", \"params\": {\"name\": \"list_databases\", \"arguments\": {}}}"
        }
      }
    },
    {
      "name": "List Tables",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/mcp",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"method\": \"tools/call\", \"params\": {\"name\": \"list_tables\", \"arguments\": {\"schema\": \"mydb\"}}}"
        }
      }
    },
    {
      "name": "Describe Table",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/mcp",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"method\": \"tools/call\", \"params\": {\"name\": \"describe_table\", \"arguments\": {\"schema\": \"mydb\", \"table\": \"users\"}}}"
        }
      }
    },
    {
      "name": "Run Query",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/mcp",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"method\": \"tools/call\", \"params\": {\"name\": \"run_query\", \"arguments\": {\"sql\": \"SELECT 1\"}}}"
        }
      }
    },
    {
      "name": "Ping",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/mcp",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"method\": \"tools/call\", \"params\": {\"name\": \"ping\", \"arguments\": {}}}"
        }
      }
    },
    {
      "name": "Server Info",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/mcp",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"method\": \"tools/call\", \"params\": {\"name\": \"server_info\", \"arguments\": {}}}"
        }
      }
    }
  ]
}
```

## Error Responses

| HTTP Status | Meaning |
|-------------|---------|
| `200` | Success |
| `400` | Bad request (missing tool name, unknown method) |
| `401` | Unauthorized (invalid or missing API key) |
| `404` | Unknown tool name |
| `422` | Validation error (invalid SQL, domain error) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

Error response body:

```json
{
  "error": "Description of what went wrong",
  "code": 400
}
```
