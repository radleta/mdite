import chalk from 'chalk';
import { LintResults } from '../types/results.js';
import { Logger } from '../utils/logger.js';

export class Reporter {
  constructor(
    private format: 'text' | 'json',
    private logger: Logger
  ) {}

  report(results: LintResults): void {
    if (this.format === 'json') {
      this.reportJson(results);
    } else {
      this.reportText(results);
    }
  }

  private reportText(results: LintResults): void {
    const errors = results.getAllErrors();

    if (errors.length === 0) {
      this.logger.success('No issues found!');
      return;
    }

    // Header to stderr
    this.logger.header(`Found ${errors.length} issue(s)`);
    this.logger.line();

    // Group by file
    const byFile = new Map<string, typeof errors>();
    for (const error of errors) {
      if (!byFile.has(error.file)) {
        byFile.set(error.file, []);
      }
      byFile.get(error.file)!.push(error);
    }

    // Report each file - data to stdout
    for (const [file, fileErrors] of byFile) {
      this.logger.log(chalk.underline(file));
      for (const error of fileErrors) {
        const location = error.line > 0 ? `${error.line}:${error.column}` : '-';
        const severity = error.severity === 'error' ? chalk.red('error') : chalk.yellow('warn');
        const rule = chalk.gray(`[${error.rule}]`);

        this.logger.log(`  ${location} ${severity} ${error.message} ${rule}`);
      }
      this.logger.log('');
    }

    // Summary to stderr
    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warnCount = errors.filter(e => e.severity === 'warning').length;

    this.logger.error(`${errorCount} error(s), ${warnCount} warning(s)`);
  }

  private reportJson(results: LintResults): void {
    console.log(JSON.stringify(results.getAllErrors(), null, 2));
  }
}
