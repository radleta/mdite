export interface DocNode {
  path: string;
}

export class DocGraph {
  private nodes = new Map<string, DocNode>();
  private edges = new Map<string, Set<string>>();

  addFile(filePath: string): void {
    this.nodes.set(filePath, { path: filePath });
  }

  addEdge(from: string, to: string): void {
    if (!this.edges.has(from)) {
      this.edges.set(from, new Set());
    }
    this.edges.get(from)!.add(to);
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
}
