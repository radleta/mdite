export interface DocNode {
  path: string;
  depth: number;
}

export class DocGraph {
  private nodes = new Map<string, DocNode>();
  private edges = new Map<string, Set<string>>();
  private reverseEdges = new Map<string, Set<string>>();

  addFile(filePath: string, depth: number): void {
    this.nodes.set(filePath, { path: filePath, depth });
  }

  addEdge(from: string, to: string): void {
    // Add forward edge (from → to)
    if (!this.edges.has(from)) {
      this.edges.set(from, new Set());
    }
    this.edges.get(from)!.add(to);

    // Add reverse edge (to ← from)
    if (!this.reverseEdges.has(to)) {
      this.reverseEdges.set(to, new Set());
    }
    this.reverseEdges.get(to)!.add(from);
  }

  hasFile(filePath: string): boolean {
    return this.nodes.has(filePath);
  }

  getAllFiles(): string[] {
    return Array.from(this.nodes.keys());
  }

  getOutgoingLinks(filePath: string): string[] {
    return Array.from(this.edges.get(filePath) || []);
  }

  getIncomingLinks(filePath: string): string[] {
    return Array.from(this.reverseEdges.get(filePath) || []);
  }

  getDepth(filePath: string): number | undefined {
    return this.nodes.get(filePath)?.depth;
  }

  getFilesUpToDepth(maxDepth: number): string[] {
    return Array.from(this.nodes.entries())
      .filter(([_, node]) => node.depth <= maxDepth)
      .map(([path, _]) => path);
  }

  /**
   * Get all files in dependency order (depth-first traversal)
   *
   * Files are returned in an order where dependencies come before dependents.
   * For example, if A links to B, B will appear before A in the result.
   *
   * This is useful for operations that need to process files in dependency order,
   * such as concatenating documentation where referenced files should appear first.
   *
   * @returns Array of file paths in dependency order
   *
   * @example
   * ```typescript
   * const graph = new DocGraph();
   * graph.addFile('README.md', 0);
   * graph.addFile('guide.md', 1);
   * graph.addEdge('README.md', 'guide.md');
   *
   * const ordered = graph.getFilesInDependencyOrder();
   * // Returns: ['guide.md', 'README.md']
   * ```
   */
  getFilesInDependencyOrder(): string[] {
    const result: string[] = [];
    const visited = new Set<string>();

    const visit = (file: string) => {
      if (visited.has(file)) {
        return; // Already visited (cycle or multiple paths)
      }
      visited.add(file);

      // Visit dependencies first (depth-first)
      const links = this.getOutgoingLinks(file);
      for (const link of links) {
        // Only visit if the link is in the graph (it might not be if it's broken)
        if (this.hasFile(link)) {
          visit(link);
        }
      }

      // Add this file after its dependencies
      result.push(file);
    };

    // Start from files at depth 0 (entrypoints)
    const entrypoints = Array.from(this.nodes.entries())
      .filter(([_, node]) => node.depth === 0)
      .map(([path, _]) => path)
      .sort(); // Sort for deterministic ordering

    for (const entrypoint of entrypoints) {
      visit(entrypoint);
    }

    // Visit any remaining files that weren't reachable from entrypoints
    // This handles disconnected components in the graph
    for (const file of this.getAllFiles()) {
      if (!visited.has(file)) {
        visit(file);
      }
    }

    return result;
  }
}
