import { Command } from 'commander';
import { DocLinter } from '../core/doc-linter.js';
import { ConfigManager } from '../core/config-manager.js';
import { Reporter } from '../core/reporter.js';
import { Logger } from '../utils/logger.js';

export function lintCommand(): Command {
  return new Command('lint')
    .description('Lint documentation files')
    .argument('[path]', 'Documentation directory', '.')
    .option('--fix', 'Auto-fix issues (not implemented in v1)')
    .option('--format <type>', 'Output format (text|json)', 'text')
    .action(async (path: string, options, command) => {
      const isJsonFormat = options.format === 'json';
      const logger = new Logger(command.optsWithGlobals().colors !== false && !isJsonFormat);

      try {
        if (!isJsonFormat) {
          logger.header('doc-lint');
        }

        // Load configuration
        const configManager = new ConfigManager();
        const config = await configManager.load({
          ...command.optsWithGlobals(),
          basePath: path,
        });

        if (!isJsonFormat) {
          logger.info(`Linting: ${path}`);
          logger.info(`Entrypoint: ${config.entrypoint}`);
          logger.line();
        }

        // Run linter
        const linter = new DocLinter(config, logger);
        const results = await linter.lint(path, isJsonFormat);

        // Report results
        const reporter = new Reporter(options.format, logger);
        reporter.report(results);

        // Exit with appropriate code
        process.exit(results.hasErrors() ? 1 : 0);
      } catch (error) {
        logger.error('Linting failed', error as Error);
        process.exit(1);
      }
    });
}
