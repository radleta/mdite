export interface DocNode {
  path: string;
}

export class DocGraph {
  private nodes = new Map<string, DocNode>();
  private edges = new Map<string, Set<string>>();
  private reverseEdges = new Map<string, Set<string>>();

  addFile(filePath: string): void {
    this.nodes.set(filePath, { path: filePath });
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
}
