import { Command } from 'commander';
import { DocLinter } from '../core/doc-linter.js';
import { ConfigManager } from '../core/config-manager.js';
import { Reporter } from '../core/reporter.js';
import { Logger } from '../utils/logger.js';
import { CliOptions } from '../types/config.js';

export function lintCommand(): Command {
  return new Command('lint')
    .description('Lint documentation files')
    .argument('[path]', 'Documentation directory', '.')
    .option('--format <type>', 'Output format (text|json)', 'text')
    .option('--entrypoint <file>', 'Entrypoint file (overrides config)')
    .action(async (path: string, options, command) => {
      const globalOpts = command.optsWithGlobals();
      const isJsonFormat = options.format === 'json';

      // Determine colors setting: disabled for JSON format or if explicitly disabled
      const colors = !isJsonFormat && globalOpts.colors !== false;
      const logger = new Logger(colors);

      try {
        if (!isJsonFormat) {
          logger.header('mdite');
        }

        // Build CLI options for the new layered config system
        const cliOptions: CliOptions = {
          entrypoint: options.entrypoint,
          format: options.format,
          colors,
          verbose: globalOpts.verbose,
          config: globalOpts.config,
        };

        // Load configuration with proper layering
        const configManager = await ConfigManager.load(cliOptions);
        const config = configManager.getConfig();

        if (!isJsonFormat) {
          logger.info(`Linting: ${path}`);
          logger.info(`Entrypoint: ${config.entrypoint}`);
          if (config.verbose) {
            logger.info(`Format: ${config.format}`);
            logger.info(`Colors: ${config.colors}`);
          }
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
