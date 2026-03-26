# API Endpoints & Payloads — Quick Reference

> **Documentation:** See [docs/REST-API.md](docs/REST-API.md) for full HTTP API docs, curl examples, and Postman collection.
>
> This file is a raw request reference for quick copy-paste testing with tools like
> [REST Client (VS Code)](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) or Postman.

# Base URL: http://localhost:3000
# Header:   Content-Type: application/json

# =============================================================
# GET /health
# =============================================================

GET http://localhost:3000/health

# Response: {"status":"ok"}


# =============================================================
# POST /mcp  —  tools/list  (see all available tools)
# =============================================================

POST http://localhost:3000/mcp
{"method":"tools/list"}


# =============================================================
# POST /mcp  —  tools/call  (run a tool)
# =============================================================


# ── CORE TOOLS ─────────────────────────────────────────────


# ping
{"method":"tools/call","params":{"name":"ping","arguments":{}}}

# server_info
{"method":"tools/call","params":{"name":"server_info","arguments":{}}}

# list_databases
{"method":"tools/call","params":{"name":"list_databases","arguments":{}}}

# list_tables  →  required: schema
{"method":"tools/call","params":{"name":"list_tables","arguments":{"schema":"Empirical_Prod"}}}

# describe_table  →  required: schema, table
{"method":"tools/call","params":{"name":"describe_table","arguments":{"schema":"Empirical_Prod","table":"users"}}}

# run_query  →  required: query  |  optional: schema, max_rows
{"method":"tools/call","params":{"name":"run_query","arguments":{"query":"SELECT * FROM users LIMIT 10","schema":"Empirical_Prod"}}}
{"method":"tools/call","params":{"name":"run_query","arguments":{"query":"SELECT count(*) FROM orders","schema":"Empirical_Prod","max_rows":5}}}
{"method":"tools/call","params":{"name":"run_query","arguments":{"query":"SHOW TABLES"}}}


# ── SCHEMA TOOLS ───────────────────────────────────────────


# list_schemas  →  optional: filter
{"method":"tools/call","params":{"name":"list_schemas","arguments":{}}}
{"method":"tools/call","params":{"name":"list_schemas","arguments":{"filter":"Emp"}}}

# use_schema  →  required: schema
{"method":"tools/call","params":{"name":"use_schema","arguments":{"schema":"Empirical_Prod"}}}

# describe_schema  →  required: schema
{"method":"tools/call","params":{"name":"describe_schema","arguments":{"schema":"Empirical_Prod"}}}

# schema_search  →  required: name  |  optional: type (table|view|procedure|function)
{"method":"tools/call","params":{"name":"schema_search","arguments":{"name":"user"}}}
{"method":"tools/call","params":{"name":"schema_search","arguments":{"name":"order","type":"table"}}}


# ── CONNECTION TOOLS ───────────────────────────────────────


# list_connections
{"method":"tools/call","params":{"name":"list_connections","arguments":{}}}

# use_connection  →  required: name
{"method":"tools/call","params":{"name":"use_connection","arguments":{"name":"default"}}}


# ── EXTENDED TOOLS (requires MYSQL_MCP_EXTENDED=true) ──────


# list_indexes  →  required: schema, table
{"method":"tools/call","params":{"name":"list_indexes","arguments":{"schema":"Empirical_Prod","table":"users"}}}

# show_create_table  →  required: schema, table
{"method":"tools/call","params":{"name":"show_create_table","arguments":{"schema":"Empirical_Prod","table":"users"}}}

# explain_query  →  required: query
{"method":"tools/call","params":{"name":"explain_query","arguments":{"query":"SELECT * FROM users WHERE id = 1"}}}

# list_views  →  required: schema
{"method":"tools/call","params":{"name":"list_views","arguments":{"schema":"Empirical_Prod"}}}

# list_triggers  →  required: schema
{"method":"tools/call","params":{"name":"list_triggers","arguments":{"schema":"Empirical_Prod"}}}

# list_procedures  →  required: schema
{"method":"tools/call","params":{"name":"list_procedures","arguments":{"schema":"Empirical_Prod"}}}

# show_create_procedure  →  required: schema, procedure
{"method":"tools/call","params":{"name":"show_create_procedure","arguments":{"schema":"Empirical_Prod","procedure":"your_procedure_name"}}}

# call_procedure  →  required: schema, procedure  |  optional: args (ordered array of IN/INOUT values)
{"method":"tools/call","params":{"name":"call_procedure","arguments":{"schema":"Empirical_Prod","procedure":"your_procedure_name"}}}
{"method":"tools/call","params":{"name":"call_procedure","arguments":{"schema":"Empirical_Prod","procedure":"your_procedure_name","args":["value1",42,null]}}}

# compare_procedures  →  required: procedure_a{schema,procedure}, procedure_b{schema,procedure}  |  optional: args (per SP), sample_mismatch_limit (1-20, default 5), sequential (bool, default false)
{"method":"tools/call","params":{"name":"compare_procedures","arguments":{"procedure_a":{"schema":"Empirical_Prod","procedure":"sp_v1"},"procedure_b":{"schema":"Empirical_Prod","procedure":"sp_v2"}}}}
{"method":"tools/call","params":{"name":"compare_procedures","arguments":{"procedure_a":{"schema":"Empirical_Prod","procedure":"sp_old","args":[42]},"procedure_b":{"schema":"Empirical_Prod","procedure":"sp_new","args":[42]},"sample_mismatch_limit":10}}}
{"method":"tools/call","params":{"name":"compare_procedures","arguments":{"procedure_a":{"schema":"Empirical_Prod","procedure":"sp_old","args":[42]},"procedure_b":{"schema":"Empirical_Prod","procedure":"sp_new","args":[42]},"sequential":true}}}

# list_functions  →  required: schema
{"method":"tools/call","params":{"name":"list_functions","arguments":{"schema":"Empirical_Prod"}}}

# list_partitions  →  required: schema, table
{"method":"tools/call","params":{"name":"list_partitions","arguments":{"schema":"Empirical_Prod","table":"events"}}}

# database_size  →  optional: database
{"method":"tools/call","params":{"name":"database_size","arguments":{}}}
{"method":"tools/call","params":{"name":"database_size","arguments":{"database":"Empirical_Prod"}}}

# table_size  →  required: schema  |  optional: table
{"method":"tools/call","params":{"name":"table_size","arguments":{"schema":"Empirical_Prod"}}}
{"method":"tools/call","params":{"name":"table_size","arguments":{"schema":"Empirical_Prod","table":"users"}}}

# foreign_keys  →  required: schema, table
{"method":"tools/call","params":{"name":"foreign_keys","arguments":{"schema":"Empirical_Prod","table":"orders"}}}

# list_status  →  optional: filter
{"method":"tools/call","params":{"name":"list_status","arguments":{}}}
{"method":"tools/call","params":{"name":"list_status","arguments":{"filter":"Threads"}}}

# list_variables  →  optional: filter
{"method":"tools/call","params":{"name":"list_variables","arguments":{}}}
{"method":"tools/call","params":{"name":"list_variables","arguments":{"filter":"max_connections"}}}
