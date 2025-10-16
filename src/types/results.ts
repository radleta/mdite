import { LintError } from './errors.js';

export class LintResults {
  constructor(
    private data: {
      orphans: string[];
      linkErrors: LintError[];
      remarkErrors: LintError[];
    }
  ) {}

  get orphans(): string[] {
    return this.data.orphans;
  }

  get linkErrors(): LintError[] {
    return this.data.linkErrors;
  }

  get remarkErrors(): LintError[] {
    return this.data.remarkErrors;
  }

  get errorCount(): number {
    return this.getAllErrors().filter(e => e.severity === 'error').length;
  }

  get warningCount(): number {
    return this.getAllErrors().filter(e => e.severity === 'warning').length;
  }

  hasErrors(): boolean {
    return this.getAllErrors().some(e => e.severity === 'error');
  }

  getAllErrors(): LintError[] {
    return [...this.orphanErrors(), ...this.data.linkErrors, ...this.data.remarkErrors];
  }

  private orphanErrors(): LintError[] {
    return this.data.orphans.map(file => ({
      rule: 'orphan-files',
      severity: 'error' as const,
      file,
      line: 0,
      column: 0,
      message: 'Orphaned file: not reachable from entrypoint',
    }));
  }
}
