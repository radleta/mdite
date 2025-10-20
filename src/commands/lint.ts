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
    .argument('[paths...]', 'Documentation files or directory', ['.'])
    .option('--format <type>', 'Output format (text|json)', 'text')
    .option('--entrypoint <file>', 'Entrypoint file (overrides config)')
    .option('--depth <n>', 'Maximum depth of traversal (default: unlimited)', 'unlimited')
    .option(
      '--exclude <pattern...>',
      'Exclude file patterns (gitignore-style, can be used multiple times)'
    )
    .option('--respect-gitignore', 'Respect .gitignore patterns')
    .option('--no-exclude-hidden', "Don't exclude hidden directories")
    .option(
      '--validate-excluded-links <mode>',
      'How to handle links to excluded files (ignore|warn|error)',
      'ignore'
    )
    .action(async (pathsArg: string[], options, command) => {
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

        // Determine if multi-file mode
        const isMultiFile = pathsArg.length > 1;

        // Validation: Cannot use --entrypoint with multiple files
        if (isMultiFile && options.entrypoint) {
          logger.error('Cannot use --entrypoint option with multiple file paths');
          process.exit(ExitCode.USAGE_ERROR);
        }

        let basePath: string;
        let entrypoints: string[] = []; // Will be set in multi-file or single-file mode
        let entrypointOverride: string | undefined = options.entrypoint;

        if (isMultiFile) {
          // Multi-file mode: all paths must be files (not directories)
          basePath = path.resolve('.');

          for (const p of pathsArg) {
            const resolvedPath = path.resolve(p);
            try {
              const stats = await fs.stat(resolvedPath);
              if (stats.isDirectory()) {
                logger.error(`Cannot mix directories and files: ${p}`);
                logger.error('Use either a single directory or multiple files');
                process.exit(ExitCode.USAGE_ERROR);
              }
            } catch {
              logger.error(`File not found: ${p}`);
              process.exit(ExitCode.USAGE_ERROR);
            }
          }

          // Resolve to relative paths from basePath
          entrypoints = pathsArg.map(p => path.relative(basePath, path.resolve(p)));

          if (!isJsonFormat) {
            logger.info(`Linting ${entrypoints.length} file(s)`);
            if (globalOpts.verbose) {
              entrypoints.forEach(ep => logger.info(`  - ${ep}`));
            }
          }
        } else {
          // Single path mode (existing behavior)
          const pathArg = pathsArg[0] || '.';
          const resolvedPath = path.resolve(pathArg);

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
        }

        // Build CLI options
        const cliOptions: CliOptions = {
          entrypoint: isMultiFile ? undefined : entrypointOverride,
          format: options.format,
          colors,
          verbose: globalOpts.verbose,
          depth: depthValue,
          config: globalOpts.config,
          exclude: options.exclude,
          respectGitignore: options.respectGitignore,
          excludeHidden: options.excludeHidden,
          validateExcludedLinks: options.validateExcludedLinks,
        };

        // Load configuration
        const configManager = await ConfigManager.load(cliOptions);
        const config = configManager.getConfig();

        // For single-file mode, use config entrypoint if not set
        if (!isMultiFile) {
          entrypoints = [config.entrypoint];

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
        }

        // Run linter
        const linter = new DocLinter(config, logger);
        const results = isMultiFile
          ? await linter.lintMultiple(basePath, entrypoints, isJsonFormat)
          : await linter.lint(basePath, isJsonFormat);

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
