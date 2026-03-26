import winston from 'winston';
import type { ILogger } from '../../domain/interfaces/logger.js';
import type { LoggingConfig } from '../../shared/config.js';

export class WinstonLogger implements ILogger {
  private readonly logger: winston.Logger;

  constructor(config: LoggingConfig) {
    const format = config.jsonLogs
      ? winston.format.json()
      : winston.format.simple();

    this.logger = winston.createLogger({
      level: config.silent ? 'error' : config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        format,
      ),
      transports: [
        new winston.transports.Console({
          stderrLevels: ['error', 'warn', 'info', 'debug'], // 🔥 KEY FIX
        }),
      ],
    });
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }
}
