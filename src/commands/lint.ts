import { Command } from 'commander';
import { DocLinter } from '../core/doc-linter.js';
import { ConfigManager } from '../core/config-manager.js';
import { Reporter } from '../core/reporter.js';
import { Logger, shouldUseColors } from '../utils/logger.js';
import { CliOptions } from '../types/config.js';
import { ExitCode } from '../types/exit-codes.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Help Text - Colocated with command for easy maintenance
// ============================================================================

const DESCRIPTION = `
DESCRIPTION:
  Validate documentation structure and content. Builds a dependency graph
  from the entrypoint file and checks for:

  - Orphaned files (not reachable from entrypoint)
  - Broken file links (links to non-existent files)
  - Broken anchor links (references to non-existent headings)

  Multi-file mode: Pass multiple files to lint them as separate entry points.
  Each file starts at depth 0, results are merged. Perfect for pre-commit
  hooks to validate only changed files.
`;

const EXAMPLES = `
EXAMPLES:
  Validate all documentation from current directory:
      $ mdite lint

  Lint specific directory:
      $ mdite lint ./docs

  JSON output for CI/CD:
      $ mdite lint --format json

  Pipe to jq for analysis:
      $ mdite lint --format json | jq '.[] | select(.severity=="error")'

  Lint only changed files (pre-commit hook):
      $ mdite lint $(git diff --cached --name-only | grep '\\.md$') --depth 1

  Limit validation depth:
      $ mdite lint --depth 2

  Quiet mode for scripting:
      $ mdite lint --quiet || echo "Validation failed"

  Multi-file validation:
      $ mdite lint README.md docs/api.md docs/guide.md

  Exclude patterns:
      $ mdite lint --exclude "archive/**" --exclude "draft-*"

  Respect .gitignore:
      $ mdite lint --respect-gitignore
`;

const OUTPUT = `
OUTPUT:
  - Data to stdout (pipeable): Validation errors and warnings
  - Messages to stderr (suppressible): Progress updates, summaries, headers
  - Quiet mode (--quiet): Suppresses stderr messages, keeps only errors on stdout
  - Format options (--format):
      • text: Human-readable with colors, file:line:col format (default)
      • json: Structured array [{file, line, column, severity, rule, message, endColumn?, literal?, resolvedPath?}]
      • grep: Tab-delimited with 8 fields: file, line, column, endColumn, severity, rule, literal, resolvedPath
  - Color handling: Auto-disabled for JSON/grep and when piped, respects NO_COLOR/FORCE_COLOR
  - Exit codes: 0=no errors, 1=validation errors, 2=invalid arguments, 130=interrupted
  - TTY detection: Colors auto-disable when piped to other tools (grep, jq, less)
  - Error output: Validation errors go to stdout, system errors to stderr
  - Pipe-friendly: Works with grep, jq, awk, cut - clean stdout for processing
  - Grep format: Tab-delimited for easy extraction with cut/awk, includes literal link text
`;

const SEE_ALSO = `
SEE ALSO:
  Core workflow:
    mdite deps               Analyze dependencies before refactoring
    mdite files              List files in documentation graph

  Configuration:
    mdite config             View current configuration
    mdite init               Create config file

  Global:
    mdite --help             Main help with exit codes and environment variables
`;

// ============================================================================
// Command Definition
// ============================================================================

export function lintCommand(): Command {
  return new Command('lint')
    .description('Lint documentation files')
    .addHelpText('after', DESCRIPTION)
    .argument('[paths...]', 'Documentation files or directory', ['.'])
    .option('--format <type>', 'Output format (text|json|grep)', 'text')
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
    .option('--no-scope-limit', 'Disable scope limiting (unlimited traversal)')
    .option('--scope-root <dir>', 'Explicit scope root directory')
    .option(
      '--external-links <policy>',
      'How to handle external links (validate|warn|error|ignore)',
      'validate'
    )
    .addHelpText('after', EXAMPLES)
    .addHelpText('after', OUTPUT)
    .addHelpText('after', SEE_ALSO)
    .action(async (pathsArg: string[], options, command) => {
      const globalOpts = command.optsWithGlobals();
      const isJsonFormat = options.format === 'json';
      const isGrepFormat = options.format === 'grep';

      // Determine colors setting
      const colors = (() => {
        if (isJsonFormat || isGrepFormat) return false; // JSON and grep never use colors
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
          scopeLimit: options.scopeLimit,
          scopeRoot: options.scopeRoot,
          externalLinks: options.externalLinks,
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
