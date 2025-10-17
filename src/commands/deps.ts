import { Command } from 'commander';
import { ConfigManager } from '../core/config-manager.js';
import { GraphAnalyzer } from '../core/graph-analyzer.js';
import { DependencyAnalyzer } from '../core/dependency-analyzer.js';
import { DependencyReporter, OutputFormat } from '../utils/dependency-reporter.js';
import { Logger, shouldUseColors } from '../utils/logger.js';
import { ExitCode } from '../types/exit-codes.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { CliOptions } from '../types/config.js';

export function depsCommand(): Command {
  return new Command('deps')
    .description('Show file dependencies in the documentation graph')
    .argument('<file>', 'Markdown file to analyze')
    .option('--incoming', 'Show only incoming dependencies (what references this file)')
    .option('--outgoing', 'Show only outgoing dependencies (what this file references)')
    .option('--depth <n>', 'Maximum depth of traversal', 'unlimited')
    .option('--format <type>', 'Output format (tree|list|json)', 'tree')
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

        const graphAnalyzer = new GraphAnalyzer(basePath, config);
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
