import chalk from 'chalk';

/**
 * Determine if colors should be used based on environment
 * Follows NO_COLOR and FORCE_COLOR conventions
 * @see https://no-color.org/
 */
export function shouldUseColors(): boolean {
  // NO_COLOR convention - existence of env var disables colors
  if ('NO_COLOR' in process.env) return false;

  // FORCE_COLOR convention - force colors even when not TTY
  if ('FORCE_COLOR' in process.env) return true;

  // CI environment - typically disable colors unless forced
  if (process.env.CI === 'true' && !('FORCE_COLOR' in process.env)) {
    return false;
  }

  // Auto-detect: only use colors if stdout is a TTY
  return process.stdout.isTTY ?? false;
}

export interface LoggerOptions {
  /** Use colored output */
  colors?: boolean;
  /** Suppress informational output (only show errors) */
  quiet?: boolean;
  /** Show verbose/debug output */
  verbose?: boolean;
}

export class Logger {
  private colors: boolean;
  private quiet: boolean;
  private verbose: boolean;

  constructor(colors?: boolean, options: Omit<LoggerOptions, 'colors'> = {}) {
    this.colors = colors ?? shouldUseColors();
    this.quiet = options.quiet ?? false;
    this.verbose = options.verbose ?? false;
  }

  /**
   * Print header (to stderr, suppressed in quiet mode)
   */
  header(message: string): void {
    if (this.quiet) return;
    console.error('');
    console.error(this.colors ? chalk.bold(message) : message);
    console.error(this.colors ? chalk.gray('─'.repeat(50)) : '-'.repeat(50));
  }

  /**
   * Print info message (to stderr, suppressed in quiet mode)
   */
  info(message: string): void {
    if (this.quiet) return;
    const icon = this.colors ? chalk.blue('ℹ') : 'i';
    console.error(`${icon} ${message}`);
  }

  /**
   * Print success message (to stderr, suppressed in quiet mode)
   */
  success(message: string): void {
    if (this.quiet) return;
    const icon = this.colors ? chalk.green('✓') : '✓';
    console.error(`${icon} ${message}`);
  }

  /**
   * Print warning message (to stderr, suppressed in quiet mode)
   */
  warn(message: string): void {
    if (this.quiet) return;
    const icon = this.colors ? chalk.yellow('⚠') : '!';
    console.error(`${icon} ${message}`);
  }

  /**
   * Print error message (to stderr, always shown even in quiet mode)
   */
  error(message: string, error?: Error): void {
    const icon = this.colors ? chalk.red('✗') : '✗';
    console.error(`${icon} ${message}`);
    if (error && (process.env.DEBUG || this.verbose)) {
      console.error(error.stack);
    }
  }

  /**
   * Print debug message (to stderr, only in verbose mode)
   */
  debug(message: string): void {
    if (!this.verbose) return;
    const icon = this.colors ? chalk.gray('→') : '→';
    console.error(`${icon} ${message}`);
  }

  /**
   * Print data/output message (to stdout, for piping)
   */
  log(message: string): void {
    console.log(message);
  }

  /**
   * Print blank line (to stderr, suppressed in quiet mode)
   */
  line(): void {
    if (this.quiet) return;
    console.error('');
  }
}
