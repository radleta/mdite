import ignore, { type Ignore } from 'ignore';
import { readFileSync, existsSync } from 'fs';
import { join, relative, isAbsolute, sep } from 'path';
import { Logger } from '../utils/logger.js';

export interface ExclusionOptions {
  /** Base directory for relative pattern resolution */
  basePath: string;

  /** Patterns from config */
  configPatterns?: string[];

  /** Patterns from CLI */
  cliPatterns?: string[];

  /** Path to .mditeignore file (optional) */
  ignorePath?: string;

  /** Whether to respect .gitignore */
  respectGitignore?: boolean;

  /** Path to .gitignore file (optional, defaults to <basePath>/.gitignore) */
  gitignorePath?: string;

  /** Exclude hidden directories (default: true) */
  excludeHidden?: boolean;

  /** Built-in patterns (node_modules, etc.) */
  useBuiltinPatterns?: boolean;

  /** Logger instance for debug output */
  logger?: Logger;
}

export interface ExclusionStats {
  totalPatterns: number;
  sourceBreakdown: {
    builtin: number;
    gitignore: number;
    ignorefile: number;
    config: number;
    cli: number;
  };
  patterns: string[];
}

/**
 * ExclusionManager - Centralized exclusion pattern management
 *
 * Manages file exclusion patterns from multiple sources:
 * 1. CLI arguments (highest priority)
 * 2. Configuration file
 * 3. .mditeignore file
 * 4. .gitignore file (if enabled)
 * 5. Built-in defaults (lowest priority)
 *
 * Uses the `ignore` package for gitignore-compatible pattern matching.
 */
export class ExclusionManager {
  private ig: Ignore;
  private basePath: string;
  private stats: ExclusionStats;
  private logger?: Logger;
  private pathCache: Map<string, string> = new Map();

  constructor(options: ExclusionOptions) {
    this.basePath = options.basePath;
    this.logger = options.logger;
    this.ig = ignore();

    // Initialize stats
    this.stats = {
      totalPatterns: 0,
      sourceBreakdown: {
        builtin: 0,
        gitignore: 0,
        ignorefile: 0,
        config: 0,
        cli: 0,
      },
      patterns: [],
    };

    // Load patterns from all sources
    this.load(options);

    // Log stats if verbose
    if (this.logger) {
      this.logger.debug(`ExclusionManager initialized with ${this.stats.totalPatterns} patterns`);
      this.logger.debug(`  Built-in: ${this.stats.sourceBreakdown.builtin}`);
      this.logger.debug(`  Gitignore: ${this.stats.sourceBreakdown.gitignore}`);
      this.logger.debug(`  Ignore file: ${this.stats.sourceBreakdown.ignorefile}`);
      this.logger.debug(`  Config: ${this.stats.sourceBreakdown.config}`);
      this.logger.debug(`  CLI: ${this.stats.sourceBreakdown.cli}`);
    }
  }

  /**
   * Check if a path should be excluded.
   * @param filePath - Absolute or relative path to check
   * @returns true if path should be excluded, false otherwise
   */
  shouldExclude(filePath: string): boolean {
    const relativePath = this.toRelativePath(filePath);

    // If path is outside basePath (starts with ../), don't exclude
    // The ignore library doesn't support paths starting with ../
    if (relativePath.startsWith('../') || relativePath.startsWith('..\\')) {
      return false;
    }

    return this.ig.ignores(relativePath);
  }

  /**
   * Check if a directory should be excluded.
   * (Optimization: skip traversal into excluded directories)
   * @param dirPath - Absolute or relative path to directory
   * @returns true if directory should be excluded, false otherwise
   */
  shouldExcludeDirectory(dirPath: string): boolean {
    const relativePath = this.toRelativePath(dirPath);

    // If path is outside basePath (starts with ../), don't exclude
    // The ignore library doesn't support paths starting with ../
    if (relativePath.startsWith('../') || relativePath.startsWith('..\\')) {
      return false;
    }

    // Check both with and without trailing slash
    return this.ig.ignores(relativePath) || this.ig.ignores(`${relativePath}/`);
  }

  /**
   * Filter an array of paths, removing excluded ones.
   * @param paths - Array of paths to filter (absolute or relative)
   * @returns Filtered array with excluded paths removed
   */
  filterPaths(paths: string[]): string[] {
    return paths.filter(path => !this.shouldExclude(path));
  }

  /**
   * Get statistics about loaded patterns.
   */
  getStats(): ExclusionStats {
    return { ...this.stats };
  }

  /**
   * Get all active patterns (for debugging/verbose output).
   */
  getPatterns(): string[] {
    return [...this.stats.patterns];
  }

  /**
   * Load patterns from all sources and build ignore instance.
   */
  private load(options: ExclusionOptions): void {
    const allPatterns: string[] = [];

    // 1. Built-in patterns (lowest priority)
    if (options.useBuiltinPatterns !== false) {
      const builtinPatterns = this.loadBuiltinPatterns(options.excludeHidden);
      allPatterns.push(...builtinPatterns);
      this.stats.sourceBreakdown.builtin = builtinPatterns.length;
      this.logger?.debug(`Loaded ${builtinPatterns.length} built-in patterns`);
    }

    // 2. Gitignore patterns (if enabled)
    if (options.respectGitignore) {
      const gitignorePath = options.gitignorePath || join(this.basePath, '.gitignore');
      const gitignorePatterns = this.loadIgnoreFilePatterns(gitignorePath, 'gitignore');
      allPatterns.push(...gitignorePatterns);
      this.stats.sourceBreakdown.gitignore = gitignorePatterns.length;
      this.logger?.debug(`Loaded ${gitignorePatterns.length} .gitignore patterns`);
    }

    // 3. .mditeignore patterns
    if (options.ignorePath) {
      const ignorePatterns = this.loadIgnoreFilePatterns(options.ignorePath, 'ignorefile');
      allPatterns.push(...ignorePatterns);
      this.stats.sourceBreakdown.ignorefile = ignorePatterns.length;
      this.logger?.debug(`Loaded ${ignorePatterns.length} .mditeignore patterns`);
    } else {
      // Auto-detect .mditeignore in basePath
      const defaultIgnorePath = join(this.basePath, '.mditeignore');
      if (existsSync(defaultIgnorePath)) {
        const ignorePatterns = this.loadIgnoreFilePatterns(defaultIgnorePath, 'ignorefile');
        allPatterns.push(...ignorePatterns);
        this.stats.sourceBreakdown.ignorefile = ignorePatterns.length;
        this.logger?.debug(`Loaded ${ignorePatterns.length} .mditeignore patterns`);
      }
    }

    // 4. Config patterns
    if (options.configPatterns && options.configPatterns.length > 0) {
      const configPatterns = this.filterEmptyPatterns(options.configPatterns);
      allPatterns.push(...configPatterns);
      this.stats.sourceBreakdown.config = configPatterns.length;
      this.logger?.debug(`Loaded ${configPatterns.length} config patterns`);
    }

    // 5. CLI patterns (highest priority)
    if (options.cliPatterns && options.cliPatterns.length > 0) {
      const cliPatterns = this.filterEmptyPatterns(options.cliPatterns);
      allPatterns.push(...cliPatterns);
      this.stats.sourceBreakdown.cli = cliPatterns.length;
      this.logger?.debug(`Loaded ${cliPatterns.length} CLI patterns`);
    }

    // Add all patterns to ignore instance
    if (allPatterns.length > 0) {
      this.ig.add(allPatterns);
      this.stats.patterns = allPatterns;
      this.stats.totalPatterns = allPatterns.length;
    }
  }

  /**
   * Convert absolute path to relative path for ignore matching.
   * Caches results for performance.
   */
  private toRelativePath(absolutePath: string): string {
    // Check cache first
    if (this.pathCache.has(absolutePath)) {
      return this.pathCache.get(absolutePath)!;
    }

    // If already relative, return as-is
    let relativePath: string;
    if (!isAbsolute(absolutePath)) {
      relativePath = absolutePath;
    } else {
      relativePath = relative(this.basePath, absolutePath);
    }

    // Normalize to forward slashes (gitignore standard)
    if (sep === '\\') {
      relativePath = relativePath.replace(/\\/g, '/');
    }

    // Cache the result
    this.pathCache.set(absolutePath, relativePath);

    return relativePath;
  }

  /**
   * Load built-in patterns (node_modules, hidden dirs if enabled).
   */
  private loadBuiltinPatterns(excludeHidden?: boolean): string[] {
    const patterns: string[] = [];

    // Always exclude node_modules
    patterns.push('node_modules/');

    // Exclude hidden directories if enabled (default: true)
    if (excludeHidden !== false) {
      patterns.push('.*'); // Match any hidden file or directory
    }

    return patterns;
  }

  /**
   * Load patterns from ignore file (.gitignore or .mditeignore).
   */
  private loadIgnoreFilePatterns(filePath: string, source: 'gitignore' | 'ignorefile'): string[] {
    try {
      if (!existsSync(filePath)) {
        this.logger?.debug(`${source} file not found: ${filePath}`);
        return [];
      }

      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      // Filter out comments and empty lines
      const patterns = lines
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));

      return patterns;
    } catch (err) {
      this.logger?.error(`Failed to load ${source} file: ${filePath}`);
      this.logger?.error(err instanceof Error ? err.message : String(err));
      return [];
    }
  }

  /**
   * Filter out empty or whitespace-only patterns.
   */
  private filterEmptyPatterns(patterns: string[]): string[] {
    return patterns.filter(p => p && p.trim().length > 0);
  }

  /**
   * Clear the path cache (useful for testing).
   */
  clearCache(): void {
    this.pathCache.clear();
  }
}
