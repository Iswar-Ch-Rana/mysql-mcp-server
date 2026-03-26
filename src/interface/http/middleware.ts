import type { RequestHandler, ErrorRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import type { HttpConfig } from '../../shared/config.js';
import type { ILogger } from '../../domain/interfaces/logger.js';
import {
  SqlValidationError,
  NotFoundError,
  ConnectionError,
} from '../../domain/errors.js';

export function createRateLimiter(config: HttpConfig): RequestHandler {
  return rateLimit({
    windowMs: 1000,
    max: config.rateLimitRps,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export function createApiKeyAuth(apiKey: string): RequestHandler {
  return (req, res, next) => {
    if (!apiKey) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      res.status(401).json({ error: 'Unauthorized', code: 401 });
      return;
    }

    next();
  };
}

export function createRequestLogger(logger: ILogger): RequestHandler {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: duration,
      });
    });

    next();
  };
}

export function createErrorHandler(logger: ILogger): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    let status = 500;
    const message = err instanceof Error ? err.message : String(err);

    if (err instanceof SqlValidationError) {
      status = 400;
    } else if (err instanceof NotFoundError) {
      status = 404;
    } else if (err instanceof ConnectionError) {
      status = 503;
    }

    logger.error('HTTP error', { error: message, status });
    res.status(status).json({ error: message, code: status });
  };
}
