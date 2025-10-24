import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root, Link, Heading, PhrasingContent } from 'mdast';
import { promises as fs } from 'fs';
import { visit } from 'unist-util-visit';
import { slugify } from '../utils/slug.js';

/**
 * Centralized markdown cache
 *
 * Eliminates redundant file reads and parsing operations by caching:
 * - File content (raw markdown)
 * - Parsed AST (unified/remark)
 * - Derived data (headings, links)
 *
 * This cache significantly improves performance when files are accessed
 * multiple times during graph building and link validation.
 *
 * @example
 * ```typescript
 * const cache = new MarkdownCache();
 *
 * // First call: reads file and parses
 * const ast1 = await cache.getAST('/path/to/file.md');
 *
 * // Second call: returns cached AST (no I/O or parsing)
 * const ast2 = await cache.getAST('/path/to/file.md');
 *
 * // Clear cache when done
 * cache.clear();
 * ```
 */
export class MarkdownCache {
  /**
   * Shared unified processor instance
   * Creating this once instead of per-file saves significant overhead
   */
  private static processor = unified().use(remarkParse);

  /**
   * Cache for raw file content
   * Key: absolute file path, Value: file content string
   */
  private contentCache = new Map<string, string>();

  /**
   * Cache for parsed markdown AST
   * Key: absolute file path, Value: parsed AST root node
   */
  private astCache = new Map<string, Root>();

  /**
   * Cache for extracted headings (as slugs)
   * Key: absolute file path, Value: array of heading slugs
   */
  private headingsCache = new Map<string, string[]>();

  /**
   * Cache for extracted links
   * Key: absolute file path, Value: array of relative file paths
   */
  private linksCache = new Map<string, string[]>();

  /**
   * Get file content (cached)
   *
   * Reads file from disk on first access, then caches for subsequent calls.
   *
   * @param filePath - Absolute path to markdown file
   * @returns File content as string
   * @throws {Error} If file cannot be read
   */
  async getContent(filePath: string): Promise<string> {
    if (!this.contentCache.has(filePath)) {
      const content = await fs.readFile(filePath, 'utf-8');
      this.contentCache.set(filePath, content);
    }
    return this.contentCache.get(filePath)!;
  }

  /**
   * Get parsed AST (cached)
   *
   * Parses markdown on first access, then caches for subsequent calls.
   * Uses shared processor instance for efficiency.
   *
   * @param filePath - Absolute path to markdown file
   * @returns Parsed markdown AST
   */
  async getAST(filePath: string): Promise<Root> {
    if (!this.astCache.has(filePath)) {
      const content = await this.getContent(filePath);
      const ast = MarkdownCache.processor.parse(content) as Root;
      this.astCache.set(filePath, ast);
    }
    return this.astCache.get(filePath)!;
  }

  /**
   * Get heading slugs (cached)
   *
   * Extracts headings from AST on first access, then caches.
   *
   * @param filePath - Absolute path to markdown file
   * @returns Array of heading slugs (GitHub-style)
   *
   * @example
   * ```typescript
   * // File contains: ## My Heading and ### Another One
   * const headings = await cache.getHeadings('/path/to/file.md');
   * // Returns: ['my-heading', 'another-one']
   * ```
   */
  async getHeadings(filePath: string): Promise<string[]> {
    if (!this.headingsCache.has(filePath)) {
      const ast = await this.getAST(filePath);
      const headings = this.extractHeadings(ast);
      this.headingsCache.set(filePath, headings);
    }
    return this.headingsCache.get(filePath)!;
  }

  /**
   * Get links (cached)
   *
   * Extracts links from AST on first access, then caches.
   *
   * @param filePath - Absolute path to markdown file
   * @returns Array of relative file paths (without anchors)
   *
   * @example
   * ```typescript
   * // File contains: [Guide](./guide.md) [API](./api.md#methods)
   * const links = await cache.getLinks('/path/to/file.md');
   * // Returns: ['./guide.md', './api.md']
   * ```
   */
  async getLinks(filePath: string): Promise<string[]> {
    if (!this.linksCache.has(filePath)) {
      const ast = await this.getAST(filePath);
      const links = this.extractLinks(ast);
      this.linksCache.set(filePath, links);
    }
    return this.linksCache.get(filePath)!;
  }

  /**
   * Extract heading slugs from AST
   *
   * Visits all heading nodes in the AST and converts their text content
   * to GitHub-style slugs (lowercase, hyphens, etc.)
   *
   * @param ast - Parsed markdown AST
   * @returns Array of heading slugs
   * @private
   */
  private extractHeadings(ast: Root): string[] {
    const headings: string[] = [];

    visit(ast, 'heading', (node: Heading) => {
      // Extract text from heading
      const text = node.children
        .filter((child: PhrasingContent) => child.type === 'text')
        .map((child: PhrasingContent) => (child.type === 'text' ? child.value : ''))
        .join('');
      headings.push(slugify(text));
    });

    return headings;
  }

  /**
   * Extract relative markdown links from AST
   *
   * Visits all link nodes and extracts relative `.md` links,
   * filtering out external links and anchor-only references.
   *
   * @param ast - Parsed markdown AST
   * @returns Array of relative file paths (without anchors)
   * @private
   */
  private extractLinks(ast: Root): string[] {
    const links: string[] = [];

    visit(ast, 'link', (node: Link) => {
      const url = node.url;
      // Only extract relative .md links
      if (!url.startsWith('http') && !url.startsWith('#')) {
        // Remove anchor if present
        const filePart = url.split('#')[0];
        if (filePart && filePart.endsWith('.md')) {
          links.push(filePart);
        }
      }
    });

    return links;
  }

  /**
   * Clear all caches
   *
   * Removes all cached data to free memory. Useful when processing
   * is complete or when you want to ensure fresh reads.
   */
  clear(): void {
    this.contentCache.clear();
    this.astCache.clear();
    this.headingsCache.clear();
    this.linksCache.clear();
  }

  /**
   * Get cache statistics
   *
   * Returns information about the current cache state for monitoring
   * and debugging purposes.
   *
   * @returns Object with cache size metrics
   *
   * @example
   * ```typescript
   * const stats = cache.getStats();
   * console.log(`Cached ${stats.cachedFiles} files (${stats.cacheSize} bytes)`);
   * ```
   */
  getStats() {
    return {
      cachedFiles: this.contentCache.size,
      cacheSize: Array.from(this.contentCache.values()).reduce(
        (sum, content) => sum + content.length,
        0
      ),
    };
  }
}
