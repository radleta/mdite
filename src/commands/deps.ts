import { Command } from 'commander';
import { ConfigManager } from '../core/config-manager.js';
import { GraphAnalyzer } from '../core/graph-analyzer.js';
import { DependencyAnalyzer } from '../core/dependency-analyzer.js';
import { DependencyReporter, OutputFormat } from '../utils/dependency-reporter.js';
import { Logger, shouldUseColors } from '../utils/logger.js';
import { ExitCode } from '../types/exit-codes.js';
import { ExclusionManager } from '../core/exclusion-manager.js';
import { MarkdownCache } from '../core/markdown-cache.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { CliOptions } from '../types/config.js';

// ============================================================================
// Help Text - Colocated with command for easy maintenance
// ============================================================================

const DESCRIPTION = `
DESCRIPTION:
  Analyze and display dependency relationships between markdown files.

  Use cases:
    - Impact analysis: What will break if I change this file?
    - Refactoring: Which files depend on this one?
    - Cleanup: Is this file still referenced?
    - Navigation: What does this file link to?

  Output formats:
    - tree: Hierarchical view (default, human-readable)
    - list: Flat file list (pipe-friendly)
    - json: Structured data (programmatic processing)
`;

const EXAMPLES = `
EXAMPLES:
  Show all dependencies (tree view):
      $ mdite deps README.md

  Impact analysis - what references this file?
      $ mdite deps docs/api.md --incoming

  Scope analysis - what does this file depend on?
      $ mdite deps docs/guide.md --outgoing

  Limit depth for focused view:
      $ mdite deps README.md --depth 2

  JSON output for tooling:
      $ mdite deps README.md --format json | jq '.stats'

  List format for piping:
      $ mdite deps README.md --format list

  Check if file has dependencies:
      $ mdite deps docs/orphan.md --outgoing && echo "Has dependencies"
`;

const OUTPUT = `
OUTPUT:
  - Data to stdout (pipeable): Tree structure, list of files, or JSON data
  - Messages to stderr (suppressible): Progress messages, errors, summaries
  - Quiet mode (--quiet): Suppresses stderr progress, keeps stdout data
  - Format options (--format):
      • tree: Hierarchical view with indentation and branch characters
      • list: One file per line (perfect for piping to grep, xargs, etc.)
      • json: Structured data with stats, incoming, outgoing arrays
  - Color handling: Auto-disabled for JSON and when piped, respects NO_COLOR/FORCE_COLOR
  - Exit codes: 0=success, 1=file not found, 2=invalid arguments, 130=interrupted
  - TTY detection: Colors auto-disable when piped to other tools (grep, jq, less)
  - Error output: Errors go to stderr, never mixed with data on stdout
  - Pipe-friendly: Works with grep, jq, awk, xargs - clean stdout for processing
  - JSON structure: {file, stats, incoming[], outgoing[], cycles[]} for programmatic use
`;

const SEE_ALSO = `
SEE ALSO:
  Core workflow:
    mdite lint               Validate all links in dependency graph
    mdite files              List files in graph with filtering options

  Configuration:
    mdite config             View current configuration
    mdite init               Create config file

  Global:
    mdite --help             Main help with exit codes and environment variables
`;

// ============================================================================
// Command Definition
// ============================================================================

export function depsCommand(): Command {
  return new Command('deps')
    .description('Show file dependencies in the documentation graph')
    .addHelpText('after', DESCRIPTION)
    .argument('<file>', 'Markdown file to analyze')
    .option('--incoming', 'Show only incoming dependencies (what references this file)')
    .option('--outgoing', 'Show only outgoing dependencies (what this file references)')
    .option('--depth <n>', 'Maximum depth of traversal', 'unlimited')
    .option('--format <type>', 'Output format (tree|list|json)', 'tree')
    .option(
      '--exclude <pattern...>',
      'Exclude file patterns (gitignore-style, can be used multiple times)'
    )
    .option('--respect-gitignore', 'Respect .gitignore patterns')
    .option('--no-exclude-hidden', "Don't exclude hidden directories")
    .addHelpText('after', EXAMPLES)
    .addHelpText('after', OUTPUT)
    .addHelpText('after', SEE_ALSO)
    .action(async (file: string, options, command) => {
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
        // Validate format option
        const validFormats: OutputFormat[] = ['tree', 'list', 'json'];
        if (!validFormats.includes(options.format as OutputFormat)) {
          logger.error(`Invalid format: ${options.format}. Must be one of: tree, list, json`);
          process.exit(ExitCode.USAGE_ERROR);
        }

        // Build CLI options
        const cliOptions: CliOptions = {
          colors,
          verbose: globalOpts.verbose,
          config: globalOpts.config,
          exclude: options.exclude,
          respectGitignore: options.respectGitignore,
          excludeHidden: options.excludeHidden,
        };

        // Load configuration
        const configManager = await ConfigManager.load(cliOptions);
        const config = configManager.getConfig();

        // Resolve file path (use realpath to handle symlinks consistently)
        const resolvedFile = path.resolve(file);
        const filePath = await fs.realpath(resolvedFile).catch(() => resolvedFile);

        // Determine basePath by walking up from the file's directory to find the entrypoint
        // This allows running deps from any directory with an absolute or relative path
        let basePath = path.dirname(filePath);
        let entrypointPath = path.join(basePath, config.entrypoint);

        // Walk up the directory tree to find where the entrypoint exists
        while (basePath !== path.dirname(basePath)) {
          try {
            await fs.access(entrypointPath);
            // Found the entrypoint, use this as basePath
            break;
          } catch {
            // Entrypoint not found, try parent directory
            basePath = path.dirname(basePath);
            entrypointPath = path.join(basePath, config.entrypoint);
          }
        }

        // Last check at root level
        try {
          await fs.access(entrypointPath);
        } catch {
          // If entrypoint not found anywhere, use the original file's directory
          basePath = path.dirname(filePath);
        }

        // Build graph
        if (config.verbose && !isJsonFormat) {
          logger.info(`Building dependency graph from: ${config.entrypoint}`);
        }

        // Create cache and exclusion manager
        const cache = new MarkdownCache();
        const exclusionManager = new ExclusionManager({
          basePath,
          configPatterns: config.exclude,
          cliPatterns: config.cliExclude,
          respectGitignore: config.respectGitignore,
          excludeHidden: config.excludeHidden,
          useBuiltinPatterns: true,
          logger: config.verbose ? logger : undefined,
        });

        const graphAnalyzer = new GraphAnalyzer(basePath, config, cache, exclusionManager);
        const graph = await graphAnalyzer.buildGraph();

        // Check if file exists in graph
        if (!graph.hasFile(filePath)) {
          logger.error(`File not found in dependency graph: ${file}`);
          logger.info('The file may be orphaned or outside the documentation tree');
          process.exit(ExitCode.USAGE_ERROR);
        }

        // Parse depth option
        let maxDepth: number;
        if (options.depth === 'unlimited') {
          maxDepth = Infinity;
        } else {
          maxDepth = parseInt(options.depth, 10);
          if (isNaN(maxDepth) || maxDepth < 0) {
            logger.error(
              `Invalid depth value: '${options.depth}' (must be a positive integer or 'unlimited')`
            );
            process.exit(ExitCode.USAGE_ERROR);
          }
        }

        // Determine which dependencies to include
        // If neither flag is specified, show both
        // If only --incoming is specified, show only incoming
        // If only --outgoing is specified, show only outgoing
        // If both flags are specified, show both
        const hasIncomingFlag = options.incoming === true;
        const hasOutgoingFlag = options.outgoing === true;
        const includeIncoming = hasIncomingFlag || !hasOutgoingFlag;
        const includeOutgoing = hasOutgoingFlag || !hasIncomingFlag;

        // Analyze dependencies
        const analyzer = new DependencyAnalyzer(basePath, graph);
        const report = analyzer.analyze(filePath, {
          includeIncoming,
          includeOutgoing,
          maxDepth,
        });

        // Report results
        const reporter = new DependencyReporter(options.format as OutputFormat, logger);
        reporter.report(report, {
          colors,
          showIncoming: includeIncoming,
          showOutgoing: includeOutgoing,
        });

        process.exit(ExitCode.SUCCESS);
      } catch (error) {
        logger.error('Dependency analysis failed', error as Error);
        process.exit(ExitCode.ERROR);
      }
    });
}
