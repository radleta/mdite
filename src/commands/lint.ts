import { Command } from 'commander';
import { DocLinter } from '../core/doc-linter.js';
import { ConfigManager } from '../core/config-manager.js';
import { Reporter } from '../core/reporter.js';
import { Logger, shouldUseColors } from '../utils/logger.js';
import { CliOptions } from '../types/config.js';
import { ExitCode } from '../types/exit-codes.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export function lintCommand(): Command {
  return new Command('lint')
    .description('Lint documentation files')
    .argument('[path]', 'Documentation directory or file', '.')
    .option('--format <type>', 'Output format (text|json)', 'text')
    .option('--entrypoint <file>', 'Entrypoint file (overrides config)')
    .option('--depth <n>', 'Maximum depth of traversal (default: unlimited)', 'unlimited')
    .action(async (pathArg: string, options, command) => {
      const globalOpts = command.optsWithGlobals();
      const isJsonFormat = options.format === 'json';

      // Determine colors setting
      const colors = (() => {
        if (isJsonFormat) return false; // JSON never uses colors
        if (globalOpts.colors === true) return true; // Forced on
        if (globalOpts.colors === false) return false; // Forced off
        return shouldUseColors(); // Auto-detect
      })();

      const logger = new Logger(colors, {
        quiet: globalOpts.quiet ?? false,
        verbose: globalOpts.verbose ?? false,
      });

      try {
        // Parse depth option
        let depthValue: number | 'unlimited';
        if (options.depth === 'unlimited') {
          depthValue = 'unlimited';
        } else {
          const parsed = parseInt(options.depth, 10);
          if (isNaN(parsed) || parsed < 0) {
            logger.error(
              `Invalid depth value: '${options.depth}' (must be a non-negative integer or 'unlimited')`
            );
            process.exit(ExitCode.USAGE_ERROR);
          }
          depthValue = parsed;
        }

        if (!isJsonFormat) {
          logger.header('mdite');
        }

        // Resolve the path argument to determine if it's a file or directory
        const resolvedPath = path.resolve(path.resolve('.'), pathArg);
        let basePath: string;
        let entrypointOverride: string | undefined = options.entrypoint;

        try {
          const stats = await fs.stat(resolvedPath);
          if (stats.isFile()) {
            // If path is a file, use its directory as basePath and filename as entrypoint
            basePath = path.dirname(resolvedPath);
            // Only override entrypoint if not explicitly provided via --entrypoint flag
            if (!options.entrypoint) {
              entrypointOverride = path.basename(resolvedPath);
            }
          } else {
            // If path is a directory, use it as basePath
            basePath = resolvedPath;
          }
        } catch {
          // If path doesn't exist, treat it as a directory and let later code handle the error
          basePath = resolvedPath;
        }

        // Build CLI options for the new layered config system
        const cliOptions: CliOptions = {
          entrypoint: entrypointOverride,
          format: options.format,
          colors,
          verbose: globalOpts.verbose,
          depth: depthValue,
          config: globalOpts.config,
        };

        // Load configuration with proper layering
        const configManager = await ConfigManager.load(cliOptions);
        const config = configManager.getConfig();

        if (!isJsonFormat) {
          logger.info(`Linting: ${basePath}`);
          logger.info(`Entrypoint: ${config.entrypoint}`);
          if (config.verbose) {
            logger.info(`Format: ${config.format}`);
            logger.info(`Colors: ${config.colors}`);
            logger.info(`Depth: ${config.depth}`);
          }
          logger.line();
        }

        // Run linter
        const linter = new DocLinter(config, logger);
        const results = await linter.lint(basePath, isJsonFormat);

        // Report results
        const reporter = new Reporter(options.format, logger);
        reporter.report(results);

        // Exit with appropriate code
        process.exit(results.hasErrors() ? ExitCode.ERROR : ExitCode.SUCCESS);
      } catch (error) {
        logger.error('Linting failed', error as Error);
        process.exit(ExitCode.ERROR);
      }
    });
}
