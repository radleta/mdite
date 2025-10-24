/**
 * Base error class for all doc-lint errors
 *
 * Extends Error with additional metadata for better error handling:
 * - Error code for programmatic handling
 * - Exit code for CLI
 * - Context object for debugging
 * - User-friendly formatting
 *
 * All custom errors in doc-lint should extend this class to ensure
 * consistent error handling and reporting.
 *
 * @example
 * ```typescript
 * import { DocLintError } from './errors.js';
 *
 * throw new DocLintError('Something went wrong', {
 *   code: 'CUSTOM_ERROR',
 *   exitCode: 1,
 *   context: { file: 'README.md', line: 42 }
 * });
 * ```
 *
 * @example
 * ```typescript
 * try {
 *   // ... some operation
 * } catch (err) {
 *   throw new DocLintError('Operation failed', {
 *     code: 'OPERATION_FAILED',
 *     cause: err as Error
 *   });
 * }
 * ```
 */
export class DocLintError extends Error {
  /** Error code for programmatic handling */
  public readonly code: string;

  /** Exit code for CLI (0 = success, non-zero = failure) */
  public readonly exitCode: number;

  /** Additional context for debugging */
  public readonly context?: Record<string, unknown>;

  /**
   * Create a new DocLintError
   *
   * @param message - Human-readable error message
   * @param options - Additional error options
   * @param options.code - Error code (default: 'DOC_LINT_ERROR')
   * @param options.exitCode - Exit code (default: 1)
   * @param options.context - Additional context for debugging
   * @param options.cause - Original error that caused this error
   */
  constructor(
    message: string,
    options: {
      code?: string;
      exitCode?: number;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || 'DOC_LINT_ERROR';
    this.exitCode = options.exitCode || 1;
    this.context = options.context;

    // Maintain proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Store the cause if provided
    if (options.cause) {
      this.cause = options.cause;
    }
  }

  /**
   * Format error for display to user
   *
   * Generates a user-friendly error message with optional verbose details
   * including context and stack trace.
   *
   * @param verbose - Include stack trace and context (default: false)
   * @returns Formatted error message
   *
   * @example
   * ```typescript
   * try {
   *   // ... some operation
   * } catch (error) {
   *   if (error instanceof DocLintError) {
   *     console.error(error.toUserMessage(true)); // Verbose mode
   *   }
   * }
   * ```
   */
  toUserMessage(verbose = false): string {
    let msg = `${this.name}: ${this.message}`;

    if (verbose && this.context) {
      msg += '\n\nContext:';
      for (const [key, value] of Object.entries(this.context)) {
        msg += `\n  ${key}: ${JSON.stringify(value, null, 2)}`;
      }
    }

    if (verbose && this.stack) {
      msg += '\n\nStack trace:\n' + this.stack;
    }

    return msg;
  }
}

/**
 * Configuration-related errors
 */
export class InvalidConfigError extends DocLintError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      code: 'INVALID_CONFIG',
      exitCode: 1,
      context,
    });
  }
}

export class ConfigNotFoundError extends DocLintError {
  constructor(path: string) {
    super(`Configuration file not found: ${path}`, {
      code: 'CONFIG_NOT_FOUND',
      exitCode: 1,
      context: { path },
    });
  }
}

/**
 * File system errors
 */
export class FileNotFoundError extends DocLintError {
  constructor(path: string) {
    super(`File not found: ${path}`, {
      code: 'FILE_NOT_FOUND',
      exitCode: 1,
      context: { path },
    });
  }
}

export class DirectoryNotFoundError extends DocLintError {
  constructor(path: string) {
    super(`Directory not found: ${path}`, {
      code: 'DIRECTORY_NOT_FOUND',
      exitCode: 1,
      context: { path },
    });
  }
}

export class FileReadError extends DocLintError {
  constructor(path: string, cause?: Error) {
    super(`Failed to read file: ${path}`, {
      code: 'FILE_READ_ERROR',
      exitCode: 1,
      context: { path },
      cause,
    });
  }
}

export class FileWriteError extends DocLintError {
  constructor(path: string, cause?: Error) {
    super(`Failed to write file: ${path}`, {
      code: 'FILE_WRITE_ERROR',
      exitCode: 1,
      context: { path },
      cause,
    });
  }
}

/**
 * Validation errors
 */
export class ValidationError extends DocLintError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      code: 'VALIDATION_ERROR',
      exitCode: 1,
      context,
    });
  }
}

export class SchemaValidationError extends DocLintError {
  constructor(message: string, schema?: unknown, data?: unknown) {
    super(`Schema validation failed: ${message}`, {
      code: 'SCHEMA_VALIDATION_ERROR',
      exitCode: 1,
      context: { schema, data },
    });
  }
}

/**
 * Graph/Link errors
 */
export class GraphBuildError extends DocLintError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(`Failed to build dependency graph: ${message}`, {
      code: 'GRAPH_BUILD_ERROR',
      exitCode: 1,
      context,
    });
  }
}

export class DeadLinkError extends DocLintError {
  constructor(sourceFile: string, targetLink: string) {
    super(`Dead link in ${sourceFile}: ${targetLink}`, {
      code: 'DEAD_LINK',
      exitCode: 1,
      context: { sourceFile, targetLink },
    });
  }
}

export class DeadAnchorError extends DocLintError {
  constructor(sourceFile: string, targetFile: string, anchor: string) {
    super(`Dead anchor in ${sourceFile}: ${targetFile}#${anchor}`, {
      code: 'DEAD_ANCHOR',
      exitCode: 1,
      context: { sourceFile, targetFile, anchor },
    });
  }
}

/**
 * Parsing errors
 */
export class MarkdownParseError extends DocLintError {
  constructor(file: string, cause?: Error) {
    super(`Failed to parse markdown file: ${file}`, {
      code: 'MARKDOWN_PARSE_ERROR',
      exitCode: 1,
      context: { file },
      cause,
    });
  }
}

export class FrontmatterParseError extends DocLintError {
  constructor(file: string, cause?: Error) {
    super(`Failed to parse frontmatter in: ${file}`, {
      code: 'FRONTMATTER_PARSE_ERROR',
      exitCode: 1,
      context: { file },
      cause,
    });
  }
}

/**
 * CLI errors
 */
export class InvalidArgumentError extends DocLintError {
  constructor(argument: string, reason: string) {
    super(`Invalid argument '${argument}': ${reason}`, {
      code: 'INVALID_ARGUMENT',
      exitCode: 1,
      context: { argument, reason },
    });
  }
}

export class MissingArgumentError extends DocLintError {
  constructor(argument: string) {
    super(`Missing required argument: ${argument}`, {
      code: 'MISSING_ARGUMENT',
      exitCode: 1,
      context: { argument },
    });
  }
}

/**
 * Runtime errors
 */
export class OperationCancelledError extends DocLintError {
  constructor(operation: string) {
    super(`Operation cancelled: ${operation}`, {
      code: 'OPERATION_CANCELLED',
      exitCode: 130, // Standard exit code for SIGINT
      context: { operation },
    });
  }
}

export class TimeoutError extends DocLintError {
  constructor(operation: string, timeout: number) {
    super(`Operation timed out after ${timeout}ms: ${operation}`, {
      code: 'TIMEOUT',
      exitCode: 1,
      context: { operation, timeout },
    });
  }
}

/**
 * Type guard to check if error is a DocLintError
 *
 * @param error - Error to check
 * @returns True if error is a DocLintError instance
 *
 * @example
 * ```typescript
 * try {
 *   // ... some operation
 * } catch (error) {
 *   if (isDocLintError(error)) {
 *     console.log('Error code:', error.code);
 *     console.log('Exit code:', error.exitCode);
 *   }
 * }
 * ```
 */
export function isDocLintError(error: unknown): error is DocLintError {
  return error instanceof DocLintError;
}

/**
 * Type guard to check if error is a FileNotFoundError
 *
 * @param error - Error to check
 * @returns True if error is a FileNotFoundError instance
 *
 * @example
 * ```typescript
 * try {
 *   await readFile(path);
 * } catch (error) {
 *   if (isFileNotFoundError(error)) {
 *     console.error('File not found:', error.context?.path);
 *   }
 * }
 * ```
 */
export function isFileNotFoundError(error: unknown): error is FileNotFoundError {
  return error instanceof FileNotFoundError;
}

/**
 * Type guard to check if error is a configuration error
 *
 * @param error - Error to check
 * @returns True if error is InvalidConfigError or ConfigNotFoundError
 *
 * @example
 * ```typescript
 * try {
 *   const config = await loadConfig();
 * } catch (error) {
 *   if (isConfigError(error)) {
 *     console.error('Configuration error:', error.message);
 *     // Show helpful config documentation
 *   }
 * }
 * ```
 */
export function isConfigError(error: unknown): error is InvalidConfigError | ConfigNotFoundError {
  return error instanceof InvalidConfigError || error instanceof ConfigNotFoundError;
}

/**
 * Format error for display to user
 *
 * Handles different error types and provides consistent formatting:
 * - DocLintError: Uses toUserMessage() method
 * - Standard Error: Shows message and optional stack
 * - Unknown values: Converts to string
 *
 * @param error - Error to format (can be any type)
 * @param verbose - Include stack traces and context (default: false)
 * @returns Formatted error message string
 *
 * @example
 * ```typescript
 * try {
 *   await linter.lint('./docs');
 * } catch (error) {
 *   console.error(formatError(error, process.env.DEBUG === 'true'));
 * }
 * ```
 */
export function formatError(error: unknown, verbose = false): string {
  if (isDocLintError(error)) {
    return error.toUserMessage(verbose);
  }

  if (error instanceof Error) {
    let msg = `Error: ${error.message}`;
    if (verbose && error.stack) {
      msg += '\n\n' + error.stack;
    }
    return msg;
  }

  return `Unknown error: ${String(error)}`;
}

/**
 * Get exit code from error
 *
 * Extracts the appropriate exit code for CLI:
 * - DocLintError: Uses custom exitCode property
 * - Other errors: Returns 1 (general error)
 *
 * @param error - Error to get exit code from
 * @returns Exit code (0 = success, non-zero = failure)
 *
 * @example
 * ```typescript
 * try {
 *   await main();
 * } catch (error) {
 *   console.error(formatError(error));
 *   process.exit(getExitCode(error));
 * }
 * ```
 */
export function getExitCode(error: unknown): number {
  if (isDocLintError(error)) {
    return error.exitCode;
  }
  return 1;
}

/**
 * Convert unknown value to Error instance
 *
 * Ensures that any thrown value becomes a proper Error instance
 * for consistent error handling and stack traces.
 *
 * @param value - Value to convert (can be anything)
 * @returns Error instance
 *
 * @example
 * ```typescript
 * try {
 *   // Some code that might throw non-Error values
 *   await someLibrary();
 * } catch (value) {
 *   const error = toError(value);
 *   console.error(error.message);
 *   console.error(error.stack);
 * }
 * ```
 */
export function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  return new Error(String(value));
}
