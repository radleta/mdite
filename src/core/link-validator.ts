import * as path from 'path';
import * as fs from 'fs/promises';
import { DocGraph } from '../types/graph.js';
import { LintError } from '../types/errors.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import { slugify } from '../utils/slug.js';

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
   */
  constructor(
    private basePath: string,
    private graph: DocGraph
  ) {}

  /**
   * Validate all links in the dependency graph
   *
   * Iterates through all files in the graph and validates their links.
   * Returns a flattened array of all link errors found.
   *
   * @returns Array of lint errors for invalid links
   *
   * @example
   * ```typescript
   * const errors = await validator.validate();
   * const deadLinks = errors.filter(e => e.rule === 'dead-link');
   * const deadAnchors = errors.filter(e => e.rule === 'dead-anchor');
   * ```
   */
  async validate(): Promise<LintError[]> {
    const errors: LintError[] = [];

    for (const file of this.graph.getAllFiles()) {
      const fileErrors = await this.validateFile(file);
      errors.push(...fileErrors);
    }

    return errors;
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
    const content = await fs.readFile(filePath, 'utf-8');

    const processor = unified().use(remarkParse);
    const ast = processor.parse(content);

    const linkChecks: Promise<LintError | null>[] = [];

    visit(ast, 'link', (node: any) => {
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
      const headings = await this.extractHeadings(targetFile);
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

  /**
   * Extract all heading slugs from a markdown file
   *
   * Parses the markdown AST and converts all headings to slugs
   * using GitHub-style slugification (lowercase, hyphens, etc.)
   *
   * @param filePath - Absolute path to markdown file
   * @returns Array of heading slugs
   * @private
   *
   * @example
   * ```typescript
   * // File contains: ## My Heading and ### Another One
   * const headings = await this.extractHeadings('/path/to/file.md');
   * // Returns: ['my-heading', 'another-one']
   * ```
   */
  private async extractHeadings(filePath: string): Promise<string[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const processor = unified().use(remarkParse);
    const ast = processor.parse(content);

    const headings: string[] = [];
    visit(ast, 'heading', (node: any) => {
      // Extract text from heading
      const text = node.children
        .filter((child: any) => child.type === 'text')
        .map((child: any) => child.value)
        .join('');
      headings.push(slugify(text));
    });

    return headings;
  }
}
