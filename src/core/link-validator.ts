import * as path from 'path';
import * as fs from 'fs/promises';
import { DocGraph } from '../types/graph.js';
import { LintError } from '../types/errors.js';
import { visit } from 'unist-util-visit';
import { slugify } from '../utils/slug.js';
import type { Link } from 'mdast';
import { MarkdownCache } from './markdown-cache.js';
import { promisePool } from '../utils/promise-pool.js';

/**
 * Link validator for markdown documentation
 *
 * Validates all links in markdown files, checking both:
 * - File links (ensuring target files exist)
 * - Anchor links (ensuring target headings exist)
 *
 * External links (http://, https://) are skipped as they require
 * network requests and may be unavailable during offline linting.
 *
 * @example
 * ```typescript
 * import { LinkValidator } from './link-validator.js';
 * import { DocGraph } from '../types/graph.js';
 *
 * const graph = new DocGraph();
 * // ... populate graph
 *
 * const validator = new LinkValidator('./docs', graph);
 * const errors = await validator.validate();
 *
 * if (errors.length > 0) {
 *   console.error('Link errors found:', errors);
 * }
 * ```
 */
export class LinkValidator {
  /**
   * Create a new LinkValidator instance
   *
   * @param basePath - Base directory for documentation (absolute path)
   * @param graph - Dependency graph containing files to validate
   * @param cache - Markdown cache for efficient parsing (optional, creates new if not provided)
   * @param scopeRoot - Scope root directory for scope boundary checking (optional)
   * @param externalLinkPolicy - Policy for handling external links (default: 'validate')
   */
  constructor(
    private basePath: string,
    private graph: DocGraph,
    private cache: MarkdownCache = new MarkdownCache(),
    private scopeRoot?: string,
    private externalLinkPolicy: 'validate' | 'warn' | 'error' | 'ignore' = 'validate'
  ) {}

  /**
   * Check if a file path is within the scope boundary
   *
   * @param filePath - Absolute or relative path to check
   * @returns true if within scope or no scope is set
   * @private
   */
  private isWithinScope(filePath: string): boolean {
    if (!this.scopeRoot) {
      return true;
    }

    const normalized = path.resolve(filePath);
    const scope = path.resolve(this.scopeRoot);
    const relativePath = path.relative(scope, normalized);

    // If relative path starts with '..' or is absolute, it's outside scope
    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  }

  /**
   * Validate all links in the dependency graph
   *
   * Validates all files in parallel with controlled concurrency for optimal
   * performance and resource management.
   *
   * @param maxConcurrency - Maximum number of concurrent file validations (default: 10)
   * @returns Array of lint errors for invalid links
   *
   * @example
   * ```typescript
   * const errors = await validator.validate(10);
   * const deadLinks = errors.filter(e => e.rule === 'dead-link');
   * const deadAnchors = errors.filter(e => e.rule === 'dead-anchor');
   * ```
   */
  async validate(maxConcurrency: number = 10): Promise<LintError[]> {
    const files = this.graph.getAllFiles();

    // Validate files with controlled concurrency
    const results = await promisePool(files, file => this.validateFile(file), maxConcurrency);

    // Flatten error arrays
    return results.flat();
  }

  /**
   * Validate all links in a single file
   *
   * Parses the markdown AST and validates each link, handling:
   * - Anchor-only links (#heading)
   * - File links (./file.md)
   * - File + anchor links (./file.md#heading)
   *
   * @param filePath - Absolute path to markdown file
   * @returns Array of lint errors for this file
   * @private
   */
  private async validateFile(filePath: string): Promise<LintError[]> {
    const errors: LintError[] = [];

    // Use cache to get parsed AST
    const ast = await this.cache.getAST(filePath);

    const linkChecks: Promise<LintError | null>[] = [];

    visit(ast, 'link', (node: Link) => {
      const url = node.url;
      const position = node.position?.start || { line: 0, column: 0 };
      const endColumn = node.position?.end?.column;
      const literal = url; // The URL is the literal text from source

      // Skip external links
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return;
      }

      // Check anchor-only links
      if (url.startsWith('#')) {
        linkChecks.push(
          this.validateAnchor(url.slice(1), filePath, filePath, position, literal, endColumn)
        );
        return;
      }

      // Check file links
      const [filePart, anchor] = url.split('#');

      if (filePart) {
        const targetPath = path.resolve(path.dirname(filePath), filePart);

        linkChecks.push(
          this.validateFileLink(targetPath, filePath, position, literal, endColumn).then(error => {
            // If file link is valid and there's an anchor, check it
            if (!error && anchor) {
              return this.validateAnchor(
                anchor,
                targetPath,
                filePath,
                position,
                literal,
                endColumn
              );
            }
            return error;
          })
        );
      }
    });

    // Wait for all async validations
    const results = await Promise.all(linkChecks);
    errors.push(...results.filter((e): e is LintError => e !== null));

    return errors;
  }

  /**
   * Validate that a file link target exists
   *
   * When scope limiting is enabled, applies the external link policy to links
   * pointing outside the scope boundary.
   *
   * @param targetPath - Absolute path to target file
   * @param sourceFile - Source file containing the link
   * @param position - Line/column position of link in source
   * @param literal - Literal link text from source file (for error reporting)
   * @param endColumn - End column position for range extraction
   * @returns LintError if file doesn't exist or external link policy violated, null if valid
   * @private
   */
  private async validateFileLink(
    targetPath: string,
    sourceFile: string,
    position: { line: number; column: number },
    literal?: string,
    endColumn?: number
  ): Promise<LintError | null> {
    const targetInScope = this.isWithinScope(targetPath);

    // Check if target exists
    let exists = false;
    try {
      await fs.access(targetPath);
      exists = true;
    } catch {
      // File doesn't exist
    }

    if (!exists) {
      const resolvedPath = path.relative(this.basePath, targetPath);
      const message = literal
        ? `Dead link: '${literal}' resolves to '${resolvedPath}'`
        : `Dead link: ${resolvedPath}`;
      return {
        rule: 'dead-link',
        severity: 'error',
        file: sourceFile,
        line: position.line,
        column: position.column,
        endColumn,
        message,
        literal,
        resolvedPath,
      };
    }

    // Handle external links according to policy
    if (!targetInScope) {
      switch (this.externalLinkPolicy) {
        case 'ignore':
          return null; // No error, no warning

        case 'validate':
          return null; // Already validated existence, no warning

        case 'warn': {
          const resolvedPath = path.relative(this.basePath, targetPath);
          const message = literal
            ? `External link (outside scope): '${literal}' resolves to '${resolvedPath}'`
            : `External link (outside scope): ${resolvedPath}`;
          return {
            rule: 'external-link',
            severity: 'warning',
            file: sourceFile,
            line: position.line,
            column: position.column,
            endColumn,
            message,
            literal,
            resolvedPath,
          };
        }

        case 'error': {
          const resolvedPath = path.relative(this.basePath, targetPath);
          const message = literal
            ? `External link not allowed: '${literal}' resolves to '${resolvedPath}'`
            : `External link not allowed: ${resolvedPath}`;
          return {
            rule: 'external-link',
            severity: 'error',
            file: sourceFile,
            line: position.line,
            column: position.column,
            endColumn,
            message,
            literal,
            resolvedPath,
          };
        }
      }
    }

    return null;
  }

  /**
   * Validate that an anchor link target exists
   *
   * Extracts all headings from the target file and checks if the
   * anchor matches any heading slug. Uses GitHub-style slugification.
   *
   * @param anchor - Anchor string (without #)
   * @param targetFile - File containing the heading
   * @param sourceFile - Source file containing the link
   * @param position - Line/column position of link in source
   * @param literal - Literal link text from source file (for error reporting)
   * @param endColumn - End column position for range extraction
   * @returns LintError if anchor doesn't exist, null if valid
   * @private
   *
   * @example
   * ```typescript
   * // Link: [Section](#my-heading)
   * // Validates against heading: ## My Heading
   * await this.validateAnchor('my-heading', filePath, filePath, pos);
   * ```
   */
  private async validateAnchor(
    anchor: string,
    targetFile: string,
    sourceFile: string,
    position: { line: number; column: number },
    literal?: string,
    endColumn?: number
  ): Promise<LintError | null> {
    try {
      // Use cache to get headings
      const headings = await this.cache.getHeadings(targetFile);
      const anchorSlug = slugify(anchor);

      if (!headings.includes(anchorSlug)) {
        const resolvedPath = `#${anchor} in ${path.relative(this.basePath, targetFile)}`;
        const message = literal
          ? `Dead anchor: '${literal}' resolves to '${resolvedPath}'`
          : `Dead anchor: ${resolvedPath}`;
        return {
          rule: 'dead-anchor',
          severity: 'error',
          file: sourceFile,
          line: position.line,
          column: position.column,
          endColumn,
          message,
          literal,
          resolvedPath,
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}
