import express, { type Application } from 'express';
import type { Server } from 'node:http';
import type { ToolRegistry } from '../tools/registry.js';
import type { ILogger } from '../../domain/interfaces/logger.js';
import type { HttpConfig } from '../../shared/config.js';
import { MAX_REQUEST_BODY_BYTES } from '../../shared/constants.js';
import {
  createRateLimiter,
  createApiKeyAuth,
  createRequestLogger,
  createErrorHandler,
} from './middleware.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class HttpServer {
  private readonly app: Application;
  private server: Server | null = null;

  constructor(
    private readonly registry: ToolRegistry,
    private readonly logger: ILogger,
    private readonly config: HttpConfig,
  ) {
    this.app = express();
    this.setup();
  }

  private setup(): void {
    this.app.use(express.json({ limit: MAX_REQUEST_BODY_BYTES }));
    this.app.use(createRequestLogger(this.logger));

    if (this.config.rateLimitEnabled) {
      this.app.use(createRateLimiter(this.config));
    }

    if (this.config.apiKey) {
      this.app.use(createApiKeyAuth(this.config.apiKey));
    }

    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok' });
    });

    this.app.post('/mcp', async (req, res, next) => {
      try {
        const { method, params } = req.body as { method: string; params?: Record<string, unknown> };

        if (method === 'tools/list') {
          const tools = this.registry.getAll().map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: zodToJsonSchema(tool.inputSchema),
          }));
          res.json({ result: { tools } });
          return;
        }

        if (method === 'tools/call') {
          const toolName = (params as { name?: string })?.name;
          if (!toolName) {
            res.status(400).json({ error: 'Missing tool name', code: 400 });
            return;
          }

          const tool = this.registry.get(toolName);
          if (!tool) {
            res.status(404).json({ error: `Unknown tool: ${toolName}`, code: 404 });
            return;
          }

          const input = tool.inputSchema.parse((params as { arguments?: unknown })?.arguments ?? {});
          const result = await tool.handler(input);
          res.json({ result });
          return;
        }

        res.status(400).json({ error: `Unknown method: ${method}`, code: 400 });
      } catch (err) {
        next(err);
      }
    });

    this.app.use(createErrorHandler(this.logger));
  }

  async start(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        this.logger.info('HTTP server started', { port: this.config.port, host: this.config.host });
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    return new Promise<void>((resolve) => {
      this.server!.close(() => {
        this.logger.info('HTTP server stopped');
        this.server = null;
        resolve();
      });
    });
  }
}
