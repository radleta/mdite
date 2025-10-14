export class DocLintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocLintError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ConfigNotFoundError extends DocLintError {
  constructor() {
    super('Configuration file not found');
    this.name = 'ConfigNotFoundError';
  }
}

export class InvalidConfigError extends DocLintError {
  constructor(message: string) {
    super(`Invalid configuration: ${message}`);
    this.name = 'InvalidConfigError';
  }
}

export class FileNotFoundError extends DocLintError {
  constructor(path: string) {
    super(`File not found: ${path}`);
    this.name = 'FileNotFoundError';
  }
}
