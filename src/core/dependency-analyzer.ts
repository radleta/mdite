import { DocGraph } from '../types/graph.js';

export interface DependencyNode {
  path: string;
  depth: number;
  children: DependencyNode[];
  isCycle?: boolean;
  cycleTarget?: string;
}

export interface DependencyReport {
  file: string;
  incoming: DependencyNode[];
  outgoing: DependencyNode[];
  cycles: Array<{ from: string; to: string }>;
  stats: {
    incomingCount: number;
    outgoingCount: number;
    cyclesDetected: number;
  };
}

export interface AnalyzeOptions {
  includeIncoming?: boolean;
  includeOutgoing?: boolean;
  maxDepth?: number;
}

export class DependencyAnalyzer {
  constructor(
    _basePath: string,
    private graph: DocGraph
  ) {}

  /**
   * Analyze dependencies for a specific file
   */
  analyze(filePath: string, options: AnalyzeOptions = {}): DependencyReport {
    const { includeIncoming = true, includeOutgoing = true, maxDepth = Infinity } = options;

    const cycles: Array<{ from: string; to: string }> = [];
    const pathStack = new Set<string>();

    // Add the starting file to the path stack
    pathStack.add(filePath);

    const incoming = includeIncoming
      ? this.buildIncomingTree(filePath, maxDepth, pathStack, cycles)
      : [];

    pathStack.clear();
    pathStack.add(filePath);

    const outgoing = includeOutgoing
      ? this.buildOutgoingTree(filePath, maxDepth, pathStack, cycles)
      : [];

    const incomingCount = this.countNodes(incoming);
    const outgoingCount = this.countNodes(outgoing);

    // Deduplicate cycles - a cycle from A→B is the same as B→A
    const uniqueCycles = this.deduplicateCycles(cycles);

    return {
      file: filePath,
      incoming,
      outgoing,
      cycles: uniqueCycles,
      stats: {
        incomingCount,
        outgoingCount,
        cyclesDetected: uniqueCycles.length,
      },
    };
  }

  /**
   * Build incoming dependency tree (who references this file)
   */
  private buildIncomingTree(
    filePath: string,
    maxDepth: number,
    pathStack: Set<string>,
    cycles: Array<{ from: string; to: string }>,
    currentDepth = 0
  ): DependencyNode[] {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const incomingLinks = this.graph.getIncomingLinks(filePath);
    const nodes: DependencyNode[] = [];

    for (const link of incomingLinks) {
      if (pathStack.has(link)) {
        // Cycle detected - we've reached a node that's in our current path
        nodes.push({
          path: link,
          depth: currentDepth + 1,
          children: [],
          isCycle: true,
          cycleTarget: filePath,
        });
        cycles.push({ from: link, to: filePath });
        continue;
      }

      pathStack.add(link);
      const children = this.buildIncomingTree(link, maxDepth, pathStack, cycles, currentDepth + 1);
      pathStack.delete(link); // Backtrack for other branches

      nodes.push({
        path: link,
        depth: currentDepth + 1,
        children,
      });
    }

    return nodes;
  }

  /**
   * Build outgoing dependency tree (what this file references)
   */
  private buildOutgoingTree(
    filePath: string,
    maxDepth: number,
    pathStack: Set<string>,
    cycles: Array<{ from: string; to: string }>,
    currentDepth = 0
  ): DependencyNode[] {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const outgoingLinks = this.graph.getOutgoingLinks(filePath);
    const nodes: DependencyNode[] = [];

    for (const link of outgoingLinks) {
      if (pathStack.has(link)) {
        // Cycle detected - we've reached a node that's in our current path
        nodes.push({
          path: link,
          depth: currentDepth + 1,
          children: [],
          isCycle: true,
          cycleTarget: filePath,
        });
        cycles.push({ from: filePath, to: link });
        continue;
      }

      pathStack.add(link);
      const children = this.buildOutgoingTree(link, maxDepth, pathStack, cycles, currentDepth + 1);
      pathStack.delete(link); // Backtrack for other branches

      nodes.push({
        path: link,
        depth: currentDepth + 1,
        children,
      });
    }

    return nodes;
  }

  /**
   * Count total nodes in tree (for statistics)
   */
  private countNodes(nodes: DependencyNode[]): number {
    let count = 0;
    for (const node of nodes) {
      count += 1;
      if (node.children.length > 0) {
        count += this.countNodes(node.children);
      }
    }
    return count;
  }

  /**
   * Deduplicate cycles - treat A→B and B→A as the same cycle
   */
  private deduplicateCycles(
    cycles: Array<{ from: string; to: string }>
  ): Array<{ from: string; to: string }> {
    const seen = new Set<string>();
    const unique: Array<{ from: string; to: string }> = [];

    for (const cycle of cycles) {
      // Create a normalized key that's the same for A→B and B→A
      const key1 = `${cycle.from}|${cycle.to}`;
      const key2 = `${cycle.to}|${cycle.from}`;

      if (!seen.has(key1) && !seen.has(key2)) {
        seen.add(key1);
        unique.push(cycle);
      }
    }

    return unique;
  }
}
