import { Command } from 'commander';
import { ConfigManager } from '../core/config-manager.js';
import { GraphAnalyzer } from '../core/graph-analyzer.js';
import { Logger } from '../utils/logger.js';
import { ExitCode } from '../types/exit-codes.js';
import { ExclusionManager } from '../core/exclusion-manager.js';
import { MarkdownCache } from '../core/markdown-cache.js';
import * as path from 'path';
import { CliOptions } from '../types/config.js';
import jmespath from 'jmespath';
import matter from 'gray-matter';

// ============================================================================
// Help Text - Colocated with command for easy maintenance
// ============================================================================

const DESCRIPTION = `
DESCRIPTION:
  List files in the documentation graph with powerful filtering.
  Following Unix philosophy, mdite provides graph-filtered file lists
  that compose with the Unix ecosystem (ripgrep, sed, awk, etc.).

  Instead of reimplementing search, mdite focuses on graph operations
  and lets you use best-in-class Unix tools for everything else.

  Filtering options:
    - Depth: Files at specific distance from entrypoint
    - Frontmatter: JMESPath queries on metadata
    - Orphans: Files not reachable from entrypoint
    - Sort: By depth, incoming links, outgoing links, or alphabetically
`;

const EXAMPLES = `
EXAMPLES:
  List all reachable files:
      $ mdite files

  Filter by depth:
      $ mdite files --depth 2

  List orphaned files:
      $ mdite files --orphans

  Unix Composition - Graph-aware search:
      $ mdite files --depth 2 | xargs rg "authentication" -C 2

  Filter by frontmatter and process:
      $ mdite files --frontmatter "status=='published'" | xargs prettier --write

  Find API docs:
      $ mdite files --frontmatter "contains(tags, 'api')"

  Bulk operations:
      $ mdite files | xargs markdownlint

  Archive orphaned files:
      $ mdite files --orphans | xargs -I {} mv {} archive/

  Null-separated for xargs -0:
      $ mdite files --print0 | xargs -0 ls -l

  JSON output with metadata:
      $ mdite files --format json

  Sort by most referenced:
      $ mdite files --sort incoming

  Sort by most connections:
      $ mdite files --sort outgoing

  Annotate with depth:
      $ mdite files --with-depth

  Count total documentation files:
      $ mdite files | wc -l

  Find deeply nested files:
      $ mdite files --format json | jq '.[] | select(.depth > 3)'
`;

const OUTPUT = `
OUTPUT:
  - Data to stdout (pipeable): File paths (one per line) or JSON array
  - Messages to stderr (suppressible): Progress messages, errors, file counts
  - Quiet mode (--quiet): Suppresses stderr messages, keeps only file paths on stdout
  - Format options (--format):
      • list: One file path per line (default, perfect for piping)
      • json: Array of objects with {file, depth, orphan} metadata
  - Path format: Relative paths by default, use --absolute for full paths
  - Separator: Newline by default, use --print0 for null-separated (xargs -0)
  - Color handling: Never uses colors (file paths must be parseable)
  - Exit codes: 0=success, 1=error, 2=invalid arguments, 130=interrupted
  - TTY detection: Output always pipe-friendly regardless of terminal
  - Sorting: --sort alpha/depth/incoming/outgoing controls output order
  - Frontmatter queries: JMESPath syntax for powerful metadata filtering
`;

const SEE_ALSO = `
SEE ALSO:
  Core workflow:
    mdite lint               Validate documentation structure
    mdite deps               Analyze file dependencies

  Configuration:
    mdite config             View current configuration
    mdite init               Create config file

  Global:
    mdite --help             Main help with exit codes and environment variables

  External:
    JMESPath query syntax    https://jmespath.org/ (for --frontmatter queries)
`;

// ============================================================================
// Command Definition
// ============================================================================

export function filesCommand(): Command {
  return new Command('files')
    .description('List files in documentation graph')
    .addHelpText('after', DESCRIPTION)
    .option('--depth <n>', 'Limit to files at depth N or less', 'unlimited')
    .option('--orphans', 'List only orphaned files')
    .option('--no-orphans', 'Exclude orphaned files (default)', true)
    .option('--absolute', 'Output absolute paths')
    .option('--frontmatter <query>', 'Filter by frontmatter metadata (JMESPath query)')
    .option('--format <type>', 'Output format: list (default) or json', 'list')
    .option('--with-depth', 'Annotate output with depth information (list format only)')
    .option('--print0', 'Use null character as separator (for xargs -0)')
    .option(
      '--sort <type>',
      'Sort by: alpha (alphabetical, default), depth (shallowest first), incoming (most referenced), outgoing (most connections)',
      'alpha'
    )
    .option(
      '--exclude <pattern...>',
      'Exclude file patterns (gitignore-style, can be used multiple times)'
    )
    .option('--respect-gitignore', 'Respect .gitignore patterns')
    .option('--no-exclude-hidden', "Don't exclude hidden directories")
    .addHelpText('after', EXAMPLES)
    .addHelpText('after', OUTPUT)
    .addHelpText('after', SEE_ALSO)
    .action(async (options, command) => {
      const globalOpts = command.optsWithGlobals();

      // Determine colors setting (never use colors for file list output)
      const colors = false;

      const logger = new Logger(colors, {
        quiet: globalOpts.quiet ?? false,
        verbose: globalOpts.verbose ?? false,
      });

      try {
        // Validate format option
        if (options.format !== 'list' && options.format !== 'json') {
          logger.error(`Invalid format: ${options.format}. Must be one of: list, json`);
          process.exit(ExitCode.USAGE_ERROR);
        }

        // Validate sort option
        const validSortOptions = ['alpha', 'depth', 'incoming', 'outgoing'];
        if (!validSortOptions.includes(options.sort)) {
          logger.error(
            `Invalid sort option: ${options.sort}. Must be one of: ${validSortOptions.join(', ')}`
          );
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

        // Get base path (use CWD since we're listing from entrypoint)
        const basePath = process.cwd();

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

        // Build graph
        if (config.verbose) {
          logger.info(`Building dependency graph from: ${config.entrypoint}`);
        }

        const graphAnalyzer = new GraphAnalyzer(basePath, config, cache, exclusionManager);
        const graph = await graphAnalyzer.buildGraph();

        // Get files based on options
        let files: string[];

        if (options.orphans) {
          // List only orphaned files
          if (config.verbose) {
            logger.info('Finding orphaned files...');
          }
          files = await graphAnalyzer.findOrphans(graph);
        } else {
          // List reachable files from graph
          files = graph.getAllFiles();

          // Apply depth filter if specified
          if (options.depth !== 'unlimited') {
            const maxDepth = parseInt(options.depth, 10);
            if (isNaN(maxDepth) || maxDepth < 0) {
              logger.error(
                `Invalid depth value: '${options.depth}' (must be a positive integer or 'unlimited')`
              );
              process.exit(ExitCode.USAGE_ERROR);
            }

            if (config.verbose) {
              logger.info(`Filtering files at depth <= ${maxDepth}`);
            }

            files = files.filter(file => {
              const depth = graph.getDepth(file);
              return depth !== undefined && depth <= maxDepth;
            });
          }
        }

        // Apply frontmatter filter if specified
        if (options.frontmatter) {
          if (config.verbose) {
            logger.info(`Filtering by frontmatter: ${options.frontmatter}`);
          }

          const filteredFiles: string[] = [];

          for (const file of files) {
            try {
              const content = await cache.getContent(file);
              const parsed = matter(content);
              const frontmatter = parsed.data;

              // Evaluate JMESPath query against frontmatter
              const result = jmespath.search(frontmatter, options.frontmatter);

              // Include file if query evaluates to truthy value
              if (result) {
                filteredFiles.push(file);
              }
            } catch (error) {
              // Skip files with invalid frontmatter or query errors
              if (config.verbose) {
                logger.warn(
                  `Skipping ${file}: ${error instanceof Error ? error.message : String(error)}`
                );
              }
            }
          }

          files = filteredFiles;

          if (config.verbose) {
            logger.info(`${files.length} file(s) match frontmatter query`);
          }
        }

        // Sort files based on sort option
        if (options.sort === 'alpha') {
          // Alphabetical sort (default)
          files.sort();
        } else if (options.sort === 'depth') {
          // Sort by depth (shallowest first)
          files.sort((a, b) => {
            const depthA = graph.getDepth(a) ?? Infinity;
            const depthB = graph.getDepth(b) ?? Infinity;
            if (depthA !== depthB) {
              return depthA - depthB;
            }
            // Secondary sort: alphabetical
            return a.localeCompare(b);
          });
        } else if (options.sort === 'incoming') {
          // Sort by incoming links (most referenced first)
          files.sort((a, b) => {
            const incomingA = graph.getIncomingLinks(a).length;
            const incomingB = graph.getIncomingLinks(b).length;
            if (incomingA !== incomingB) {
              return incomingB - incomingA; // Descending order
            }
            // Secondary sort: alphabetical
            return a.localeCompare(b);
          });
        } else if (options.sort === 'outgoing') {
          // Sort by outgoing links (most connections first)
          files.sort((a, b) => {
            const outgoingA = graph.getOutgoingLinks(a).length;
            const outgoingB = graph.getOutgoingLinks(b).length;
            if (outgoingA !== outgoingB) {
              return outgoingB - outgoingA; // Descending order
            }
            // Secondary sort: alphabetical
            return a.localeCompare(b);
          });
        }

        if (config.verbose) {
          logger.info(`Found ${files.length} file(s)`);
        }

        // Output files based on format
        if (options.format === 'json') {
          // JSON output with metadata
          const jsonOutput = files.map(file => {
            const depth = graph.getDepth(file);
            // Convert to relative path by default, absolute if --absolute flag is used
            const outputPath = options.absolute ? file : path.relative(basePath, file);

            return {
              file: outputPath,
              depth: depth ?? null,
              orphan: options.orphans === true,
            };
          });

          console.log(JSON.stringify(jsonOutput, null, 2));
        } else {
          // List format (default)
          const separator = options.print0 ? '\0' : '\n';

          files.forEach((file, index) => {
            // Convert to relative path by default, absolute if --absolute flag is used
            const outputPath = options.absolute ? file : path.relative(basePath, file);
            let output = outputPath;

            // Add depth annotation if requested
            if (options.withDepth) {
              const depth = graph.getDepth(file);
              output = `${depth ?? 'orphan'} ${outputPath}`;
            }

            // Output with appropriate separator
            if (index < files.length - 1 || !options.print0) {
              process.stdout.write(output + separator);
            } else {
              process.stdout.write(output);
            }
          });

          // Add final newline unless using print0
          if (!options.print0 && files.length > 0) {
            // Already added newlines above
          }
        }

        process.exit(ExitCode.SUCCESS);
      } catch (error) {
        logger.error('File listing failed', error as Error);
        process.exit(ExitCode.ERROR);
      }
    });
}
