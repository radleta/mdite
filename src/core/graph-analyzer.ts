import * as path from 'path';
import * as fs from 'fs/promises';
import { RuntimeConfig } from '../types/config.js';
import { DocGraph } from '../types/graph.js';
import { findMarkdownFiles } from '../utils/fs.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import type { Link } from 'mdast';

/**
 * Documentation dependency graph analyzer
 *
 * Builds a directed graph of markdown files by following links from an entrypoint.
 * The graph is used for:
 * - Orphan detection (files not reachable from entrypoint)
 * - Link validation (ensuring all references are valid)
 * - Coverage analysis (understanding documentation structure)
 *
 * @example
 * ```typescript
 * import { GraphAnalyzer } from './graph-analyzer.js';
 *
 * const analyzer = new GraphAnalyzer('./docs', {
 *   entrypoint: 'README.md',
 *   // ... other config
 * });
 *
 * const graph = await analyzer.buildGraph();
 * console.log('Reachable files:', graph.getAllFiles());
 *
 * const orphans = await analyzer.findOrphans(graph);
 * console.log('Orphaned files:', orphans);
 * ```
 */
export class GraphAnalyzer {
  private graph: DocGraph;

  /**
   * Create a new GraphAnalyzer instance
   *
   * @param basePath - Base directory for documentation (absolute path)
   * @param config - Runtime configuration with entrypoint setting
   */
  constructor(
    private basePath: string,
    private config: RuntimeConfig
  ) {
    this.graph = new DocGraph();
  }

  /**
   * Build a dependency graph starting from the configured entrypoint
   *
   * Recursively follows all relative markdown links to build a complete
   * graph of reachable files. Only follows `.md` links, ignoring:
   * - External links (http://, https://)
   * - Anchor-only links (#heading)
   * - Non-markdown files
   *
   * @param maxDepth - Maximum depth to traverse (Infinity for unlimited)
   * @returns DocGraph containing all reachable files and their relationships
   * @throws {FileNotFoundError} If entrypoint doesn't exist
   * @throws {GraphBuildError} If graph building fails
   *
   * @example
   * ```typescript
   * const graph = await analyzer.buildGraph();
   * const files = graph.getAllFiles();
   * const links = graph.getEdges(files[0]);
   * ```
   */
  async buildGraph(maxDepth: number = Infinity): Promise<DocGraph> {
    const entrypoint = path.join(this.basePath, this.config.entrypoint);
    await this.visitFile(entrypoint, 0, maxDepth);
    return this.graph;
  }

  /**
   * Recursively visit a file and follow its links
   *
   * This method implements depth-first traversal with cycle detection and depth limiting.
   * Files are only visited once to prevent infinite loops from circular references.
   *
   * @param filePath - Absolute path to the markdown file
   * @param currentDepth - Current depth from entrypoint
   * @param maxDepth - Maximum allowed depth
   * @private
   */
  private async visitFile(filePath: string, currentDepth: number, maxDepth: number): Promise<void> {
    const normalized = path.resolve(filePath);

    if (this.graph.hasFile(normalized)) {
      return; // Already visited
    }

    // Beyond depth limit
    if (currentDepth > maxDepth) {
      return;
    }

    // Check if file exists
    try {
      await fs.access(normalized);
    } catch {
      return; // File doesn't exist, skip
    }

    this.graph.addFile(normalized, currentDepth);

    // Extract links
    const content = await fs.readFile(normalized, 'utf-8');
    const links = await this.extractMarkdownLinks(content);

    // Follow relative markdown links
    for (const link of links) {
      const targetPath = path.resolve(path.dirname(normalized), link);
      this.graph.addEdge(normalized, targetPath);

      // Recurse only if next depth is within limit
      if (currentDepth + 1 <= maxDepth) {
        await this.visitFile(targetPath, currentDepth + 1, maxDepth);
      }
    }
  }

  /**
   * Extract markdown links from file content
   *
   * Parses markdown AST and extracts all relative `.md` links,
   * filtering out external links and anchor-only references.
   *
   * @param content - Markdown file content
   * @returns Array of relative file paths (may include anchors)
   * @private
   *
   * @example
   * ```typescript
   * const content = '[Guide](./guide.md) [API](./api.md#methods)';
   * const links = await this.extractMarkdownLinks(content);
   * // Returns: ['./guide.md', './api.md']
   * ```
   */
  private async extractMarkdownLinks(content: string): Promise<string[]> {
    const links: string[] = [];
    const processor = unified().use(remarkParse);
    const ast = processor.parse(content);

    visit(ast, 'link', (node: Link) => {
      const url = node.url;
      // Only follow relative .md links
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
   * Find orphaned files not reachable from the dependency graph
   *
   * Compares all markdown files in the directory tree against the
   * files reachable in the graph. Files not in the graph are considered orphans.
   *
   * Orphaned files may indicate:
   * - Forgotten documentation
   * - Missing links from main documentation
   * - Work-in-progress files
   * - Files that should be deleted
   *
   * @param graph - The dependency graph built from the entrypoint
   * @returns Array of absolute paths to orphaned files
   *
   * @example
   * ```typescript
   * const graph = await analyzer.buildGraph();
   * const orphans = await analyzer.findOrphans(graph);
   *
   * if (orphans.length > 0) {
   *   console.warn('Orphaned files:', orphans);
   * }
   * ```
   *
   * @remarks
   * Skips hidden directories (starting with `.`) and `node_modules`
   */
  async findOrphans(graph: DocGraph): Promise<string[]> {
    const allFiles = await findMarkdownFiles(this.basePath);
    const reachableFiles = new Set(graph.getAllFiles());

    return allFiles.filter(file => !reachableFiles.has(path.resolve(file)));
  }
}
