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
   */
  constructor(
    private basePath: string,
    private graph: DocGraph,
    private cache: MarkdownCache = new MarkdownCache()
  ) {}

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

      // Skip external links
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return;
      }

      // Check anchor-only links
      if (url.startsWith('#')) {
        linkChecks.push(this.validateAnchor(url.slice(1), filePath, filePath, position));
        return;
      }

      // Check file links
      const [filePart, anchor] = url.split('#');

      if (filePart) {
        const targetPath = path.resolve(path.dirname(filePath), filePart);

        linkChecks.push(
          this.validateFileLink(targetPath, filePath, position).then(error => {
            // If file link is valid and there's an anchor, check it
            if (!error && anchor) {
              return this.validateAnchor(anchor, targetPath, filePath, position);
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
   * @param targetPath - Absolute path to target file
   * @param sourceFile - Source file containing the link
   * @param position - Line/column position of link in source
   * @returns LintError if file doesn't exist, null if valid
   * @private
   */
  private async validateFileLink(
    targetPath: string,
    sourceFile: string,
    position: { line: number; column: number }
  ): Promise<LintError | null> {
    try {
      await fs.access(targetPath);
      return null;
    } catch {
      return {
        rule: 'dead-link',
        severity: 'error',
        file: sourceFile,
        line: position.line,
        column: position.column,
        message: `Dead link: ${path.relative(this.basePath, targetPath)}`,
      };
    }
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
    position: { line: number; column: number }
  ): Promise<LintError | null> {
    try {
      // Use cache to get headings
      const headings = await this.cache.getHeadings(targetFile);
      const anchorSlug = slugify(anchor);

      if (!headings.includes(anchorSlug)) {
        return {
          rule: 'dead-anchor',
          severity: 'error',
          file: sourceFile,
          line: position.line,
          column: position.column,
          message: `Dead anchor: #${anchor} in ${path.relative(this.basePath, targetFile)}`,
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}
