import { Command } from 'commander';
import { ConfigManager } from '../core/config-manager.js';
import { GraphAnalyzer } from '../core/graph-analyzer.js';
import { ContentOutputter } from '../core/content-outputter.js';
import { Logger, shouldUseColors } from '../utils/logger.js';
import { ExitCode } from '../types/exit-codes.js';
import { ExclusionManager } from '../core/exclusion-manager.js';
import { MarkdownCache } from '../core/markdown-cache.js';
import * as path from 'path';
import { CliOptions } from '../types/config.js';

// ============================================================================
// Help Text - Colocated with command for easy maintenance
// ============================================================================

const DESCRIPTION = `
DESCRIPTION:
  Output documentation content in various formats and orderings.
  Designed for Unix composition - pipe to pandoc, grep, jq, or custom tools.

  Order options:
    - deps: Dependency order (respects document relationships)
    - alpha: Alphabetical order (predictable, reproducible)

  Use cases:
    - Export: Create single-file documentation artifacts
    - Transform: Pipe to pandoc for PDF/HTML generation
    - Analyze: Extract statistics or search patterns
    - Integration: Build documentation pipelines
`;

const EXAMPLES = `
EXAMPLES:
  Output all files in dependency order:
      $ mdite cat

  Output in alphabetical order:
      $ mdite cat --order alpha

  Generate PDF documentation:
      $ mdite cat --order deps | pandoc --toc -o docs.pdf

  Find TODOs across documentation:
      $ mdite cat | grep -n "TODO"

  Count total words:
      $ mdite cat | wc -w

  JSON format with metadata:
      $ mdite cat --format json | jq '.[] | {file, wordCount}'

  Custom separator:
      $ mdite cat --separator "\\n---\\n"

  Output specific files:
      $ mdite cat README.md docs/api.md

  Extract code blocks:
      $ mdite cat | awk '/\`\`\`/,/\`\`\`/'

  Generate single HTML file:
      $ mdite cat | pandoc -s -o documentation.html
`;

const SEE_ALSO = `
SEE ALSO:
  mdite files   List files for selective output
  mdite deps    Understand dependency order
`;

// ============================================================================
// Command Definition
// ============================================================================

export function catCommand(): Command {
  return new Command('cat')
    .description('Output documentation content')
    .addHelpText('after', DESCRIPTION)
    .argument('[files...]', 'Specific files to output (optional, defaults to all files in graph)')
    .option(
      '--order <type>',
      'Output order: deps (dependency order) or alpha (alphabetical)',
      'deps'
    )
    .option('--separator <text>', 'Text between files', '\\n\\n')
    .option('--format <type>', 'Output format: markdown (default) or json', 'markdown')
    .option(
      '--exclude <pattern...>',
      'Exclude file patterns (gitignore-style, can be used multiple times)'
    )
    .option('--respect-gitignore', 'Respect .gitignore patterns')
    .option('--no-exclude-hidden', "Don't exclude hidden directories")
    .addHelpText('after', EXAMPLES)
    .addHelpText('after', SEE_ALSO)
    .action(async (files: string[], options, command) => {
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
        const validFormats = ['markdown', 'json'];
        if (!validFormats.includes(options.format)) {
          logger.error(`Invalid format: ${options.format}. Must be one of: markdown, json`);
          process.exit(ExitCode.USAGE_ERROR);
        }

        // Validate order option
        const validOrders = ['deps', 'alpha'];
        if (!validOrders.includes(options.order)) {
          logger.error(`Invalid order: ${options.order}. Must be one of: deps, alpha`);
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

        // Determine base path
        const basePath = path.resolve(process.cwd());

        // Build graph
        if (!isJsonFormat) {
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

        // Parse depth from config
        const maxDepth = config.depth === 'unlimited' ? Infinity : config.depth;
        const graph = await graphAnalyzer.buildGraph(maxDepth);

        // If specific files are provided, filter the graph to only include those files
        if (files && files.length > 0) {
          // Resolve file paths
          const resolvedFiles = files.map(f => path.resolve(f));

          // Check if all files exist in graph
          const missingFiles = resolvedFiles.filter(f => !graph.hasFile(f));
          if (missingFiles.length > 0) {
            logger.error('The following files are not in the documentation graph:');
            for (const file of missingFiles) {
              logger.error(`  - ${path.relative(basePath, file)}`);
            }
            logger.info('Files may be orphaned or outside the documentation tree');
            process.exit(ExitCode.USAGE_ERROR);
          }
        }

        // Unescape separator (handle \n, \t, etc.)
        const separator = options.separator
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r');

        // Output content
        const outputter = new ContentOutputter(graph, cache, logger);
        await outputter.output({
          order: options.order as 'deps' | 'alpha',
          separator,
          format: options.format as 'markdown' | 'json',
          basePath,
        });

        process.exit(ExitCode.SUCCESS);
      } catch (error) {
        logger.error('Content output failed', error as Error);
        process.exit(ExitCode.ERROR);
      }
    });
}
