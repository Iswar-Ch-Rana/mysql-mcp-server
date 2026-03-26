# Contributing

## Development Setup

```bash
# Clone and install
git clone <repo-url>
cd mysql-mcp-server-ts
npm install

# Build
npm run build

# Run in dev mode (live reload)
npm run dev
```

## Project Structure

```
src/
  domain/           # Business rules, interfaces, errors
  application/      # Use-case services
  infrastructure/   # External adapters (MySQL, SSH, logging, config)
  interface/        # MCP tools, HTTP server, CLI
  shared/           # Constants, config types
tests/
  mocks/            # Shared mock implementations
  unit/             # Unit tests
  integration/      # Integration tests (require MySQL)
docs/               # Documentation
```

See [Architecture](ARCHITECTURE.md) for detailed layer descriptions.

## Code Style

- TypeScript strict mode
- ESM modules with `.js` import extensions
- Interfaces in `domain/interfaces/`
- Implementations in `infrastructure/`
- No default exports — use named exports everywhere

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `list-tables.tool.ts` |
| Classes | PascalCase | `SchemaService` |
| Interfaces | `I` prefix | `ISchemaRepository` |
| Functions | camelCase | `createListTablesTool` |
| Constants | UPPER_SNAKE | `DEFAULT_MAX_ROWS` |

## Adding a New Tool

1. **Create the tool file** in `src/interface/tools/`:

```typescript
// src/interface/tools/my-new-tool.tool.ts
import { z } from 'zod';
import type { ToolDefinition, ToolResponse } from './registry.js';
import type { SchemaService } from '../../application/services/schema.service.js';

export function createMyNewTool(service: SchemaService): ToolDefinition {
  return {
    name: 'my_new_tool',
    description: 'Description of what this tool does',
    inputSchema: z.object({
      schema: z.string().describe('Database schema name'),
    }),
    handler: async (input): Promise<ToolResponse> => {
      const result = await service.someMethod(input.schema);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
    group: 'extended', // 'core' | 'schema' | 'extended' | 'connection'
  };
}
```

2. **Register it** in `src/interface/tools/registry.ts`:

```typescript
import { createMyNewTool } from './my-new-tool.tool.js';

// In buildAll():
if (flags.extendedTools) {
  this.register(createMyNewTool(services.schema));
}
```

3. **Add a test** in `tests/unit/`:

```typescript
import { describe, it, expect } from 'vitest';
import { createMyNewTool } from '../../src/interface/tools/my-new-tool.tool.js';

describe('my_new_tool', () => {
  it('should return results', async () => {
    const mockService = { someMethod: vi.fn().mockResolvedValue([...]) };
    const tool = createMyNewTool(mockService as any);
    const result = await tool.handler({ schema: 'test' });
    expect(result.content[0].text).toContain('...');
  });
});
```

4. **Update the registry test count** in `tests/unit/registry.test.ts` if needed.

5. **Document the tool** in [docs/TOOLS.md](TOOLS.md).

## Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Integration tests (requires MySQL)
MYSQL_DSN="mysql://user:pass@localhost:3306/testdb" \
  npx vitest run --config vitest.config.integration.ts

# Single test file
npx vitest run tests/unit/sql-validator.test.ts
```

## Type Checking

```bash
npx tsc --noEmit
```

## Linting

```bash
npm run lint
```

## Pull Request Guidelines

1. **Branch from `main`**: Create a feature branch off `main`
2. **Small, focused PRs**: One feature or fix per PR
3. **Include tests**: All new code should have unit tests
4. **Type check passes**: `npx tsc --noEmit` must succeed
5. **Tests pass**: `npm test` must pass
6. **Lint passes**: `npm run lint` must pass
7. **Update docs**: If adding a tool, update [TOOLS.md](TOOLS.md)
8. **Descriptive commit messages**: Use conventional commits (e.g., `feat:`, `fix:`, `docs:`)

## Architecture Rules

- **Domain layer** has zero external dependencies
- **Application services** depend only on domain interfaces
- **Infrastructure** implements domain interfaces
- **Interface layer** wires tools to application services
- **Never import** from `infrastructure/` in `domain/` or `application/`
- See [Architecture](ARCHITECTURE.md) for the full dependency diagram
