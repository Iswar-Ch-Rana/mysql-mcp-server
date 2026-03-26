import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ToolRegistry } from '../../interface/tools/registry.js';
import type { ILogger } from '../../domain/interfaces/logger.js';
import { VERSION } from '../../shared/constants.js';

export class StdioTransport {
  private server: Server | null = null;

  constructor(
    private readonly registry: ToolRegistry,
    private readonly logger: ILogger,
  ) { }

  async start(): Promise<void> {
    this.server = new Server(
      { name: 'mysql-mcp-server', version: VERSION },
      { capabilities: { tools: {} } },
    );

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.registry.getAll().map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: zodToJsonSchema(tool.inputSchema) as Record<string, unknown>,
      }));
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const tool = this.registry.get(toolName);

      if (!tool) {
        return {
          content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
          isError: true,
        };
      }

      try {
        const input = tool.inputSchema.parse(request.params.arguments ?? {});
        const result = await tool.handler(input);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    });

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('MCP stdio transport started');
    process.stdin.resume();
  }

  async stop(): Promise<void> {
    if (this.server) {
      await this.server.close();
      this.server = null;
    }
  }
}
