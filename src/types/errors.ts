export type RuleSeverity = 'error' | 'warning' | 'off';

export interface LintError {
  rule: string;
  severity: 'error' | 'warning';
  file: string;
  line: number;
  column: number;
  /** End column position for range extraction */
  endColumn?: number;
  message: string;
  /** Literal link text from source file (for automated fixes) */
  literal?: string;
  /** Resolved path that the literal resolves to (for error context) */
  resolvedPath?: string;
}
