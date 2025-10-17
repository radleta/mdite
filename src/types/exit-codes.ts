/**
 * Standard Unix exit codes
 * @see https://www.gnu.org/software/libc/manual/html_node/Exit-Status.html
 */
export enum ExitCode {
  /** Success, no errors */
  SUCCESS = 0,

  /** General error (validation failures, lint errors) */
  ERROR = 1,

  /** Usage error (invalid arguments, missing files) */
  USAGE_ERROR = 2,

  /** Interrupted by signal (SIGINT/Ctrl+C) */
  INTERRUPTED = 130,
}
