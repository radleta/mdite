export type RuleSeverity = 'error' | 'warning' | 'off';

export interface LintError {
  rule: string;
  severity: 'error' | 'warning';
  file: string;
  line: number;
  column: number;
  message: string;
}
