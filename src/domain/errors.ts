export class DomainError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = this.constructor.name;
  }
}

export class SqlValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'SQL_VALIDATION_ERROR');
  }
}

export class ConnectionError extends DomainError {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR');
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, name: string) {
    super(`${entity} '${name}' not found`, 'NOT_FOUND');
  }
}

export class TimeoutError extends DomainError {
  constructor(message: string) {
    super(message, 'TIMEOUT');
  }
}

export class ConfigError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
  }
}
