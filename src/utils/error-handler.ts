import { Logger } from './logger.js';
import { formatError, getExitCode, isDocLintError } from './errors.js';

/**
 * Global error handler for CLI commands
 */
export async function handleError(
  error: unknown,
  options: {
    verbose?: boolean;
    colors?: boolean;
    exit?: boolean;
  } = {}
): Promise<void> {
  const { verbose = false, colors = true, exit = true } = options;

  const logger = new Logger(colors);

  // Format and log the error
  const message = formatError(error, verbose);
  logger.error(message);

  // Log additional debug info in verbose mode
  if (verbose && isDocLintError(error)) {
    if (error.code) {
      logger.info(`Error Code: ${error.code}`);
    }
    if (error.context) {
      logger.info(`Context: ${JSON.stringify(error.context, null, 2)}`);
    }
  }

  // Exit with appropriate code
  if (exit) {
    const exitCode = getExitCode(error);
    process.exit(exitCode);
  }
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandler<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options?: { verbose?: boolean; colors?: boolean }
): (...args: T) => Promise<R | void> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleError(error, { ...options, exit: true });
      return undefined;
    }
  };
}
