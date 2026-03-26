# Testing

## Overview

The project uses [Vitest](https://vitest.dev) for both unit and integration testing.

- **117 unit tests** across 8 test files
- **Integration tests** for real MySQL connectivity
- Separate configurations for unit and integration test runs

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run with watch mode
npm run test:watch

# Run a specific test file
npx vitest run tests/unit/sql-validator.test.ts

# Run tests matching a pattern
npx vitest run -t "validates read-only"
```

### Integration Tests

Integration tests require a running MySQL instance.

```bash
# Set the connection string
export MYSQL_DSN="mysql://user:password@localhost:3306/testdb"

# Run integration tests
npx vitest run --config vitest.config.integration.ts
```

## Test Structure

```
tests/
  mocks/
    index.ts              # Mock implementations for all interfaces
  unit/
    sql-validator.test.ts         # Domain SQL validation (34 tests)
    identifier-validator.test.ts  # Identifier quoting/validation (13 tests)
    query-service.test.ts         # QueryService validate/execute/audit (6 tests)
    schema-service.test.ts        # SchemaService delegation (15 tests)
    config-loader.test.ts         # Config loading and merging (16 tests)
    ast-sql-validator.test.ts     # AST-based SQL validation (15 tests)
    regex-sql-validator.test.ts   # Regex-based SQL validation (12 tests)
    registry.test.ts              # ToolRegistry + feature flags (6 tests)
  integration/
    mysql-repository.test.ts      # Real MySQL queries
    multi-schema.test.ts          # Multi-schema operations
```

## Test Categories

### SQL Validation Tests

Tests for the dual-layer SQL security system:

- **Domain validators** (`sql-validator.test.ts`): `isReadOnlyStatement`, `hasMultipleStatements`, `containsDangerousPatterns`, `stripStringLiterals`
- **AST validator** (`ast-sql-validator.test.ts`): Parses SQL into an AST and validates statement types and dangerous functions (SLEEP, BENCHMARK, LOAD_FILE, etc.)
- **Regex validator** (`regex-sql-validator.test.ts`): Pattern-based checks for UNION injection, stacked queries, comment injection

### Service Tests

- **QueryService** (`query-service.test.ts`): Validates SQL before execution, enforces max rows and timeout, logs to audit trail
- **SchemaService** (`schema-service.test.ts`): Delegates to repository with correct parameters, propagates errors

### Configuration Tests

- **Config loader** (`config-loader.test.ts`): Tests `parseEnvConfig`, `mergeConfigs`, `loadConfig` with the full priority chain (CLI > env > file > defaults)

### Tool Registry Tests

- **Registry** (`registry.test.ts`): Registers tools, respects `extendedTools` feature flag (12 core + 16 extended = 28 total)

## Mocks

All mocks are defined in `tests/mocks/index.ts`:

| Mock | Implements |
|------|------------|
| `MockDatabaseRepository` | `IDatabaseRepository` |
| `MockSchemaRepository` | `ISchemaRepository` |
| `MockQueryRepository` | `IQueryRepository` |
| `MockSqlValidator` | `ISqlValidator` |
| `MockLogger` | `ILogger` |
| `MockAuditLogger` | `IAuditLogger` |

Each mock uses `vi.fn()` stubs that can be configured per test:

```typescript
const mockRepo = new MockQueryRepository();
mockRepo.execute.mockResolvedValue({ rows: [...], fields: [...] });
```

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MyFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    // Act
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('MySQL Integration', () => {
  let adapter: MySqlAdapter;

  beforeAll(async () => {
    adapter = new MySqlAdapter();
    await adapter.connect(process.env.MYSQL_DSN!, defaultPoolConfig, defaultSslConfig);
  });

  afterAll(async () => {
    await adapter.disconnect();
  });

  it('should query the database', async () => {
    const result = await adapter.query('SELECT 1 AS val');
    expect(result.rows).toHaveLength(1);
  });
});
```

## Vitest Configuration

### Unit Tests (`vitest.config.ts`)

```typescript
{
  test: {
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/integration/**'],
  }
}
```

### Integration Tests (`vitest.config.integration.ts`)

```typescript
{
  test: {
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 30000,
    sequence: { concurrent: false },
  }
}
```

## UI Testing with Vitest

Vitest includes a built-in UI for browsing and running tests visually.

### Setup

```bash
# Install the Vitest UI package
npm install -D @vitest/ui
```

### Running the UI

```bash
# Launch the test UI
npx vitest --ui

# Opens at http://localhost:51204/__vitest__/
```

### Features

- Browse all test files in a tree view
- Run individual tests or entire suites
- View test results, errors, and stack traces in the browser
- Watch mode with live updates
- Filter tests by name or status
- View code coverage (if configured)

## Coverage

To generate a coverage report:

```bash
# Install coverage provider
npm install -D @vitest/coverage-v8

# Run with coverage
npx vitest run --coverage
```

Coverage output is written to the `coverage/` directory.
