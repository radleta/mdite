import * as path from 'path';
import * as fs from 'fs/promises';
import { RuntimeConfig } from '../types/config.js';
import { DocGraph } from '../types/graph.js';
import { findMarkdownFiles } from '../utils/fs.js';
import { MarkdownCache } from './markdown-cache.js';
import type { ExclusionManager } from './exclusion-manager.js';

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
  private scopeRoot: string | undefined;
  private scopeLimit: boolean;
  private externalLinks: Set<string> = new Set();

  /**
   * Create a new GraphAnalyzer instance
   *
   * @param basePath - Base directory for documentation (absolute path)
   * @param config - Runtime configuration with entrypoint setting
   * @param cache - Markdown cache for efficient parsing (optional, creates new if not provided)
   * @param exclusionManager - Optional exclusion manager for filtering files
   */
  constructor(
    private basePath: string,
    private config: RuntimeConfig,
    private cache: MarkdownCache = new MarkdownCache(),
    private exclusionManager?: ExclusionManager
  ) {
    this.graph = new DocGraph();
    this.scopeLimit = config.scopeLimit;
    this.scopeRoot = config.scopeRoot ?? basePath;
  }

  /**
   * Check if a file path is within the scope boundary
   *
   * @param filePath - Absolute or relative path to check
   * @returns true if within scope or scope limiting is disabled
   * @private
   */
  private isWithinScope(filePath: string): boolean {
    if (!this.scopeLimit || !this.scopeRoot) {
      return true;
    }

    const normalized = path.resolve(filePath);
    const scope = path.resolve(this.scopeRoot);
    const relativePath = path.relative(scope, normalized);

    // If relative path starts with '..' or is absolute, it's outside scope
    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  }

  /**
   * Get all external links encountered during traversal
   *
   * External links are links pointing outside the scope boundary.
   * They are validated but not traversed.
   *
   * @returns Array of absolute paths to external files
   */
  getExternalLinks(): string[] {
    return Array.from(this.externalLinks);
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
   * When scope limiting is enabled, links outside the scope are tracked
   * as external links but not traversed.
   *
   * @param maxDepth - Maximum depth to traverse (Infinity for unlimited)
   * @returns DocGraph containing all reachable files and their relationships
   * @throws {Error} If entrypoint is outside scope
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

    // Verify entrypoint is within scope
    if (this.scopeLimit && !this.isWithinScope(entrypoint)) {
      throw new Error(
        `Entrypoint ${entrypoint} is outside scope root ${this.scopeRoot}. ` +
          `Use --scope-root to set a different scope or --no-scope-limit to disable scoping.`
      );
    }

    await this.visitFile(entrypoint, 0, maxDepth);
    return this.graph;
  }

  /**
   * Recursively visit a file and follow its links
   *
   * This method implements depth-first traversal with cycle detection, depth limiting,
   * and scope boundary checking. Files are only visited once to prevent infinite loops
   * from circular references.
   *
   * When scope limiting is enabled, links outside the scope are tracked as external
   * links but not traversed.
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

    // Check scope boundary
    if (!this.isWithinScope(normalized)) {
      // File is outside scope - don't traverse
      this.externalLinks.add(normalized);
      return;
    }

    // Check if file is excluded
    if (this.exclusionManager?.shouldExclude(normalized)) {
      return; // Skip excluded files
    }

    // Check if file exists
    try {
      await fs.access(normalized);
    } catch {
      return; // File doesn't exist, skip
    }

    this.graph.addFile(normalized, currentDepth);

    // Performance optimization: Skip link extraction at maxDepth
    // Links will be extracted during link validation anyway, so we avoid
    // unnecessary file I/O and parsing for files we won't recurse into
    if (currentDepth === maxDepth) {
      return;
    }

    // Extract links using cache
    const links = await this.cache.getLinks(normalized);

    // Follow relative markdown links
    for (const link of links) {
      const targetPath = path.resolve(path.dirname(normalized), link);

      // Check if target is within scope
      const targetInScope = this.isWithinScope(targetPath);

      if (!targetInScope) {
        // Handle external link according to policy
        this.externalLinks.add(targetPath);

        // Add edge to graph (for analysis) but don't traverse
        // This allows deps command to show external dependencies
        this.graph.addEdge(normalized, targetPath);

        // Don't recurse into external files
        continue;
      }

      // Skip excluded files - don't add edge or recurse
      if (this.exclusionManager?.shouldExclude(targetPath)) {
        continue;
      }

      this.graph.addEdge(normalized, targetPath);

      // Recurse only if next depth is within limit
      if (currentDepth + 1 <= maxDepth) {
        await this.visitFile(targetPath, currentDepth + 1, maxDepth);
      }
    }
  }

  /**
   * Find common ancestor directory for multiple paths
   *
   * @param paths - Array of absolute file paths
   * @returns Common ancestor directory path
   * @private
   */
  private findCommonAncestor(paths: string[]): string {
    if (paths.length === 0) return this.basePath;

    const firstPath = paths[0];
    if (!firstPath) return this.basePath;
    if (paths.length === 1) return path.dirname(firstPath);

    // Normalize all paths to arrays of segments
    const normalized = paths.map(p => path.resolve(p).split(path.sep));

    // Find the shortest path (upper bound on common prefix)
    const shortest = normalized.reduce((a, b) => (a.length < b.length ? a : b));

    // Find common prefix length
    let commonLength = 0;
    for (let i = 0; i < shortest.length; i++) {
      if (normalized.every(p => p[i] === shortest[i])) {
        commonLength = i + 1;
      } else {
        break;
      }
    }

    // Return common ancestor path
    const first = normalized[0];
    if (!first) return this.basePath;
    return first.slice(0, commonLength).join(path.sep) || path.sep;
  }

  /**
   * Build a merged dependency graph from multiple entry points
   *
   * Each entry point is traversed independently up to maxDepth,
   * then graphs are merged. Files appearing in multiple subgraphs
   * use the minimum depth (closest to any entry point).
   *
   * When scope limiting is enabled and no explicit scopeRoot is set,
   * the common ancestor of all entry points is used as the scope.
   *
   * @param entrypoints - Array of entry point file names (relative to basePath)
   * @param maxDepth - Maximum depth to traverse from each entry point
   * @returns Merged DocGraph containing all reachable files
   *
   * @example
   * ```typescript
   * const graph = await analyzer.buildGraphFromMultiple(
   *   ['README.md', 'api.md'],
   *   1  // depth 1 from each
   * );
   * ```
   */
  async buildGraphFromMultiple(
    entrypoints: string[],
    maxDepth: number = Infinity
  ): Promise<DocGraph> {
    // Determine common scope if scopeLimit enabled and no explicit scopeRoot
    if (this.scopeLimit && !this.config.scopeRoot) {
      const resolvedEntrypoints = entrypoints.map(ep => path.resolve(this.basePath, ep));

      // Find common ancestor directory
      const commonScope = this.findCommonAncestor(resolvedEntrypoints);
      this.scopeRoot = commonScope;
    }

    const mergedGraph = new DocGraph();

    for (const entrypoint of entrypoints) {
      const entrypointPath = path.join(this.basePath, entrypoint);

      // Verify entrypoint is within scope
      if (this.scopeLimit && !this.isWithinScope(entrypointPath)) {
        throw new Error(
          `Entrypoint ${entrypointPath} is outside scope root ${this.scopeRoot}. ` +
            `Use --scope-root to set a different scope or --no-scope-limit to disable scoping.`
        );
      }

      // Build subgraph for this entrypoint
      const subgraph = new DocGraph();
      await this.visitFileForGraph(subgraph, entrypointPath, 0, maxDepth);

      // Merge into main graph (minimum depth wins)
      this.mergeGraphs(mergedGraph, subgraph);
    }

    return mergedGraph;
  }

  /**
   * Merge source graph into target graph
   *
   * For nodes: Use minimum depth if node already exists in target
   * For edges: Add all edges (Set ensures uniqueness)
   *
   * @param target - Graph to merge into
   * @param source - Graph to merge from
   * @private
   */
  private mergeGraphs(target: DocGraph, source: DocGraph): void {
    // Merge nodes with minimum depth
    for (const filePath of source.getAllFiles()) {
      const sourceDepth = source.getDepth(filePath)!;
      const targetDepth = target.getDepth(filePath);

      if (targetDepth === undefined || sourceDepth < targetDepth) {
        target.addFile(filePath, sourceDepth);
      }
    }

    // Merge edges
    for (const from of source.getAllFiles()) {
      for (const to of source.getOutgoingLinks(from)) {
        target.addEdge(from, to);
      }
    }
  }

  /**
   * Visit a file and build its subgraph
   *
   * This is like visitFile() but builds into a provided graph instance
   * instead of this.graph, allowing multiple independent subgraphs.
   *
   * When scope limiting is enabled, links outside the scope are tracked as external
   * links but not traversed.
   *
   * @param graph - The graph to build into
   * @param filePath - Absolute path to the file
   * @param currentDepth - Current depth from entry point
   * @param maxDepth - Maximum allowed depth
   * @private
   */
  private async visitFileForGraph(
    graph: DocGraph,
    filePath: string,
    currentDepth: number,
    maxDepth: number
  ): Promise<void> {
    const normalized = path.resolve(filePath);

    // Skip if already visited in this graph
    if (graph.hasFile(normalized)) {
      return;
    }

    // Skip if beyond depth limit
    if (currentDepth > maxDepth) {
      return;
    }

    // Check scope boundary
    if (!this.isWithinScope(normalized)) {
      // File is outside scope - don't traverse
      this.externalLinks.add(normalized);
      return;
    }

    // Skip if file is excluded
    if (this.exclusionManager?.shouldExclude(normalized)) {
      return;
    }

    // Skip if file doesn't exist
    try {
      await fs.access(normalized);
    } catch {
      return;
    }

    // Add to graph
    graph.addFile(normalized, currentDepth);

    // Performance optimization: Skip link extraction at maxDepth
    // Links will be extracted during link validation anyway
    if (currentDepth === maxDepth) {
      return;
    }

    // Extract and follow links using cache
    const links = await this.cache.getLinks(normalized);

    for (const link of links) {
      const targetPath = path.resolve(path.dirname(normalized), link);

      // Check if target is within scope
      const targetInScope = this.isWithinScope(targetPath);

      if (!targetInScope) {
        // Handle external link according to policy
        this.externalLinks.add(targetPath);

        // Add edge to graph (for analysis) but don't traverse
        graph.addEdge(normalized, targetPath);

        // Don't recurse into external files
        continue;
      }

      // Skip excluded files - don't add edge or recurse
      if (this.exclusionManager?.shouldExclude(targetPath)) {
        continue;
      }

      graph.addEdge(normalized, targetPath);

      // Recurse if next depth is within limit
      if (currentDepth + 1 <= maxDepth) {
        await this.visitFileForGraph(graph, targetPath, currentDepth + 1, maxDepth);
      }
    }
  }

  /**
   * Find orphaned files not reachable from the dependency graph
   *
   * Compares all markdown files in the scope directory against the
   * files reachable in the graph. Files not in the graph are considered orphans.
   *
   * **IMPORTANT**: When scope limiting is enabled, orphan detection uses scopeRoot
   * as the scan directory, not basePath. This ensures orphans are only detected
   * within the validated scope.
   *
   * Orphaned files may indicate:
   * - Forgotten documentation
   * - Missing links from main documentation
   * - Work-in-progress files
   * - Files that should be deleted
   *
   * @param graph - The dependency graph built from the entrypoint
   * @param isDepthLimited - Whether the graph was built with depth limiting
   * @returns Array of absolute paths to orphaned files (empty if depth limited)
   *
   * @example
   * ```typescript
   * const graph = await analyzer.buildGraph();
   * const orphans = await analyzer.findOrphans(graph, false);
   *
   * if (orphans.length > 0) {
   *   console.warn('Orphaned files:', orphans);
   * }
   * ```
   *
   * @remarks
   * - Skips hidden directories (starting with `.`) and `node_modules`
   * - When `isDepthLimited` is true, returns empty array because orphan detection
   *   requires a complete graph. Files beyond the depth limit would incorrectly
   *   appear as orphans even if they are properly linked.
   * - When scope limiting is enabled, only scans within scopeRoot directory
   */
  async findOrphans(graph: DocGraph, isDepthLimited = false): Promise<string[]> {
    // Orphan detection requires a complete graph
    // With depth limiting, files beyond the depth would incorrectly appear as orphans
    if (isDepthLimited) {
      return [];
    }

    // CRITICAL: Use scopeRoot for scanning, not basePath
    // This ensures orphan detection is limited to the validated scope
    const scanDir = this.scopeRoot ?? this.basePath;
    const allFiles = await findMarkdownFiles(scanDir, this.exclusionManager);
    const reachableFiles = new Set(graph.getAllFiles());

    return allFiles.filter(file => !reachableFiles.has(path.resolve(file)));
  }
}
