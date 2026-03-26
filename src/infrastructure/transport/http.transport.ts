import type { HttpConfig } from '../../shared/config.js';
import type { ToolRegistry } from '../../interface/tools/registry.js';
import type { ILogger } from '../../domain/interfaces/logger.js';
import { HttpServer } from '../../interface/http/server.js';

export class HttpTransport {
  private httpServer: HttpServer | null = null;

  constructor(
    private readonly config: HttpConfig,
    private readonly registry: ToolRegistry,
    private readonly logger: ILogger,
  ) { }

  async start(): Promise<void> {
    this.httpServer = new HttpServer(this.registry, this.logger, this.config);
    await this.httpServer.start();
  }

  async stop(): Promise<void> {
    if (this.httpServer) {
      await this.httpServer.stop();
      this.httpServer = null;
    }
  }
}
