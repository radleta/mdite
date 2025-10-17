import { RuntimeConfig } from '../types/config.js';
import { LintResults } from '../types/results.js';
import { LintError } from '../types/errors.js';
import { Logger } from '../utils/logger.js';
import { GraphAnalyzer } from './graph-analyzer.js';
import { LinkValidator } from './link-validator.js';

/**
 * Main documentation structure analyzer
 *
 * Coordinates graph building, link validation, and orphan detection
 * to analyze markdown documentation structure.
 *
 * The analysis process follows these steps:
 * 1. Build dependency graph from entrypoint file
 * 2. Detect orphaned files (not reachable from entrypoint)
 * 3. Validate all links (files and anchors)
 * 4. Aggregate and return results
 *
 * @example
 * ```typescript
 * import { DocLinter } from './core/doc-linter.js';
 * import { Logger } from './utils/logger.js';
 *
 * const linter = new DocLinter(
 *   {
 *     entrypoint: 'README.md',
 *     format: 'text',
 *     colors: true,
 *     verbose: false,
 *     rules: {
 *       'dead-link': 'error',
 *       'orphan-files': 'warn'
 *     }
 *   },
 *   new Logger({ colors: true, verbose: false })
 * );
 *
 * const results = await linter.lint('./docs');
 * console.log(`Errors: ${results.errorCount}, Warnings: ${results.warningCount}`);
 * ```
 */
export class DocLinter {
  /**
   * Create a new DocLinter instance
   *
   * @param config - Runtime configuration for the linter
   * @param logger - Logger instance for output
   */
  constructor(
    private config: RuntimeConfig,
    private logger: Logger
  ) {}

  /**
   * Analyze documentation structure
   *
   * Performs comprehensive structural analysis including:
   * - Dependency graph building
   * - Orphan file detection
   * - Link validation (files and anchors)
   *
   * @param basePath - Absolute path to the documentation directory
   * @param quiet - Suppress progress output (default: false)
   * @returns Analysis results with errors, warnings, and statistics
   * @throws {DirectoryNotFoundError} If the directory doesn't exist
   * @throws {GraphBuildError} If graph building fails
   * @throws {FileNotFoundError} If entrypoint file doesn't exist
   *
   * @example
   * ```typescript
   * const results = await linter.lint('./docs');
   *
   * if (results.errorCount > 0) {
   *   console.error('Found errors:', results.errors);
   *   process.exit(1);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Quiet mode for programmatic use
   * const results = await linter.lint('./docs', true);
   * return results.toJSON();
   * ```
   */
  async lint(basePath: string, quiet = false): Promise<LintResults> {
    // Convert 'unlimited' to Infinity for graph analyzer
    const maxDepth = this.config.depth === 'unlimited' ? Infinity : this.config.depth;
    const isDepthLimited = this.config.depth !== 'unlimited';

    const depthMsg = this.config.depth === 'unlimited' ? 'unlimited' : `${this.config.depth}`;
    if (!quiet) this.logger.info(`Building dependency graph... (depth: ${depthMsg})`);

    // 1. Build graph with depth limit
    const graphAnalyzer = new GraphAnalyzer(basePath, this.config);
    const graph = await graphAnalyzer.buildGraph(maxDepth);

    if (!quiet) this.logger.success(`Found ${graph.getAllFiles().length} reachable files`);

    // 2. Check for orphans (skip if depth limited)
    let orphans: string[] = [];
    if (isDepthLimited) {
      if (!quiet) {
        this.logger.warn('Skipping orphan detection (depth-limited graph)');
      }
    } else {
      if (!quiet) this.logger.info('Checking for orphaned files...');
      orphans = await graphAnalyzer.findOrphans(graph, isDepthLimited);
      if (!quiet) {
        if (orphans.length > 0) {
          this.logger.error(`Found ${orphans.length} orphaned file(s)`);
        } else {
          this.logger.success('No orphaned files');
        }
      }
    }

    // 3. Validate links
    if (!quiet) this.logger.info('Validating links...');
    const linkValidator = new LinkValidator(basePath, graph);
    const linkErrors = await linkValidator.validate();
    if (!quiet) {
      if (linkErrors.length > 0) {
        this.logger.error(`Found ${linkErrors.length} link error(s)`);
      } else {
        this.logger.success('All links valid');
      }
    }

    if (!quiet) this.logger.line();

    // 4. Return results
    return new LintResults({
      orphans,
      linkErrors,
    });
  }

  /**
   * Lint multiple entry points and merge results
   *
   * This is equivalent to running lint() multiple times with different
   * entry points and merging the results. Each entry point starts at depth 0.
   *
   * @param basePath - Absolute path to the documentation directory
   * @param entrypoints - Array of entry point file names (relative to basePath)
   * @param quiet - Suppress progress output (default: false)
   * @returns Merged lint results with deduplicated errors
   *
   * @example
   * ```typescript
   * const results = await linter.lintMultiple(
   *   '/docs',
   *   ['README.md', 'api.md', 'guide.md'],
   *   false
   * );
   * ```
   */
  async lintMultiple(basePath: string, entrypoints: string[], quiet = false): Promise<LintResults> {
    const maxDepth = this.config.depth === 'unlimited' ? Infinity : this.config.depth;
    const isDepthLimited = this.config.depth !== 'unlimited';
    const depthMsg = this.config.depth === 'unlimited' ? 'unlimited' : `${this.config.depth}`;

    if (!quiet) {
      this.logger.info(`Building dependency graph... (depth: ${depthMsg})`);
    }

    // Build merged graph from all entrypoints
    const graphAnalyzer = new GraphAnalyzer(basePath, this.config);
    const mergedGraph = await graphAnalyzer.buildGraphFromMultiple(entrypoints, maxDepth);

    if (!quiet) {
      this.logger.success(`Found ${mergedGraph.getAllFiles().length} reachable files`);
    }

    // Check for orphans (skip if depth limited)
    let orphans: string[] = [];
    if (isDepthLimited) {
      if (!quiet) {
        this.logger.warn('Skipping orphan detection (depth-limited graph)');
      }
    } else {
      if (!quiet) this.logger.info('Checking for orphaned files...');
      orphans = await graphAnalyzer.findOrphans(mergedGraph, isDepthLimited);
      if (!quiet) {
        if (orphans.length > 0) {
          this.logger.error(`Found ${orphans.length} orphaned file(s)`);
        } else {
          this.logger.success('No orphaned files');
        }
      }
    }

    // Validate links
    if (!quiet) this.logger.info('Validating links...');
    const linkValidator = new LinkValidator(basePath, mergedGraph);
    const linkErrors = await linkValidator.validate();

    // Deduplicate errors (same file may be validated in multiple graphs)
    const uniqueLinkErrors = this.deduplicateLinkErrors(linkErrors);

    if (!quiet) {
      if (uniqueLinkErrors.length > 0) {
        this.logger.error(`Found ${uniqueLinkErrors.length} link error(s)`);
      } else {
        this.logger.success('All links valid');
      }
    }

    if (!quiet) this.logger.line();

    return new LintResults({
      orphans,
      linkErrors: uniqueLinkErrors,
    });
  }

  /**
   * Deduplicate link errors by file, line, column, and message
   *
   * @param errors - Array of link errors
   * @returns Deduplicated array of errors
   * @private
   */
  private deduplicateLinkErrors(errors: LintError[]): LintError[] {
    const seen = new Set<string>();
    return errors.filter(error => {
      const key = `${error.file}:${error.line}:${error.column}:${error.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
