import { describe, it, expect } from 'vitest';
import { DocGraph } from '../../src/types/graph.js';

describe('DocGraph', () => {
  it('adds files', () => {
    const graph = new DocGraph();
    graph.addFile('/path/to/file.md', 0);

    expect(graph.hasFile('/path/to/file.md')).toBe(true);
    expect(graph.getAllFiles()).toEqual(['/path/to/file.md']);
  });

  it('adds edges', () => {
    const graph = new DocGraph();
    graph.addFile('/path/from.md', 0);
    graph.addFile('/path/to.md', 1);
    graph.addEdge('/path/from.md', '/path/to.md');

    expect(graph.getOutgoingLinks('/path/from.md')).toEqual(['/path/to.md']);
  });

  it('returns empty array for file with no outgoing links', () => {
    const graph = new DocGraph();
    graph.addFile('/path/file.md', 0);

    expect(graph.getOutgoingLinks('/path/file.md')).toEqual([]);
  });

  it('returns empty array for non-existent file', () => {
    const graph = new DocGraph();

    expect(graph.getOutgoingLinks('/path/nonexistent.md')).toEqual([]);
  });

  it('handles multiple files and edges', () => {
    const graph = new DocGraph();
    graph.addFile('/a.md', 0);
    graph.addFile('/b.md', 0);
    graph.addFile('/c.md', 0);
    graph.addEdge('/a.md', '/b.md');
    graph.addEdge('/a.md', '/c.md');

    expect(graph.getAllFiles()).toHaveLength(3);
    expect(graph.getOutgoingLinks('/a.md')).toHaveLength(2);
  });

  describe('Reverse Edge Tracking', () => {
    it('should add reverse edge when adding forward edge', () => {
      const graph = new DocGraph();
      graph.addFile('/docs/a.md', 0);
      graph.addFile('/docs/b.md', 0);
      graph.addEdge('/docs/a.md', '/docs/b.md');

      const incoming = graph.getIncomingLinks('/docs/b.md');
      expect(incoming).toEqual(['/docs/a.md']);
    });

    it('should handle multiple outgoing edges from same source', () => {
      const graph = new DocGraph();
      graph.addFile('/docs/a.md', 0);
      graph.addFile('/docs/b.md', 0);
      graph.addFile('/docs/c.md', 0);
      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/a.md', '/docs/c.md');

      const outgoing = graph.getOutgoingLinks('/docs/a.md');
      expect(outgoing).toHaveLength(2);
      expect(outgoing).toContain('/docs/b.md');
      expect(outgoing).toContain('/docs/c.md');
    });

    it('should handle multiple incoming edges to same target', () => {
      const graph = new DocGraph();
      graph.addFile('/docs/a.md', 0);
      graph.addFile('/docs/b.md', 0);
      graph.addFile('/docs/c.md', 0);
      graph.addEdge('/docs/a.md', '/docs/c.md');
      graph.addEdge('/docs/b.md', '/docs/c.md');

      const incoming = graph.getIncomingLinks('/docs/c.md');
      expect(incoming).toHaveLength(2);
      expect(incoming).toContain('/docs/a.md');
      expect(incoming).toContain('/docs/b.md');
    });

    it('should not duplicate edges when added multiple times', () => {
      const graph = new DocGraph();
      graph.addFile('/docs/a.md', 0);
      graph.addFile('/docs/b.md', 0);
      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/a.md', '/docs/b.md'); // duplicate

      const outgoing = graph.getOutgoingLinks('/docs/a.md');
      expect(outgoing).toHaveLength(1);

      const incoming = graph.getIncomingLinks('/docs/b.md');
      expect(incoming).toHaveLength(1);
    });

    it('should return empty array for file with no incoming links', () => {
      const graph = new DocGraph();
      graph.addFile('/docs/a.md', 0);
      const incoming = graph.getIncomingLinks('/docs/a.md');
      expect(incoming).toEqual([]);
    });

    it('should return empty array for non-existent file', () => {
      const graph = new DocGraph();
      const incoming = graph.getIncomingLinks('/docs/nonexistent.md');
      expect(incoming).toEqual([]);
    });

    it('should handle self-referential edges', () => {
      const graph = new DocGraph();
      graph.addFile('/docs/a.md', 0);
      graph.addEdge('/docs/a.md', '/docs/a.md');

      expect(graph.getOutgoingLinks('/docs/a.md')).toContain('/docs/a.md');
      expect(graph.getIncomingLinks('/docs/a.md')).toContain('/docs/a.md');
    });

    it('should maintain consistency between forward and reverse edges', () => {
      const graph = new DocGraph();
      graph.addFile('/docs/a.md', 0);
      graph.addFile('/docs/b.md', 0);
      graph.addEdge('/docs/a.md', '/docs/b.md');

      // A → B means A's outgoing includes B
      expect(graph.getOutgoingLinks('/docs/a.md')).toContain('/docs/b.md');

      // A → B means B's incoming includes A
      expect(graph.getIncomingLinks('/docs/b.md')).toContain('/docs/a.md');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing getOutgoingLinks() behavior', () => {
      const graph = new DocGraph();
      graph.addFile('/docs/a.md', 0);
      graph.addFile('/docs/b.md', 0);
      graph.addFile('/docs/c.md', 0);

      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/a.md', '/docs/c.md');

      const outgoing = graph.getOutgoingLinks('/docs/a.md');
      expect(outgoing).toHaveLength(2);
      expect(outgoing).toContain('/docs/b.md');
      expect(outgoing).toContain('/docs/c.md');
    });

    it('should return empty array for file with no outgoing links', () => {
      const graph = new DocGraph();
      graph.addFile('/docs/a.md', 0);
      const outgoing = graph.getOutgoingLinks('/docs/a.md');
      expect(outgoing).toEqual([]);
    });
  });

  describe('getFilesInDependencyOrder', () => {
    it('should return files in dependency order (dependencies before dependents)', () => {
      const graph = new DocGraph();
      graph.addFile('/README.md', 0);
      graph.addFile('/guide.md', 1);
      graph.addFile('/api.md', 1);
      graph.addEdge('/README.md', '/guide.md');
      graph.addEdge('/README.md', '/api.md');

      const ordered = graph.getFilesInDependencyOrder();

      // guide.md and api.md should come before README.md
      const readmeIndex = ordered.indexOf('/README.md');
      const guideIndex = ordered.indexOf('/guide.md');
      const apiIndex = ordered.indexOf('/api.md');

      expect(guideIndex).toBeLessThan(readmeIndex);
      expect(apiIndex).toBeLessThan(readmeIndex);
    });

    it('should handle nested dependencies', () => {
      const graph = new DocGraph();
      graph.addFile('/README.md', 0);
      graph.addFile('/guide.md', 1);
      graph.addFile('/setup.md', 2);
      graph.addEdge('/README.md', '/guide.md');
      graph.addEdge('/guide.md', '/setup.md');

      const ordered = graph.getFilesInDependencyOrder();

      // setup.md should be first, guide.md second, README.md last
      expect(ordered).toEqual(['/setup.md', '/guide.md', '/README.md']);
    });

    it('should handle multiple entrypoints', () => {
      const graph = new DocGraph();
      graph.addFile('/README.md', 0);
      graph.addFile('/CONTRIBUTING.md', 0);
      graph.addFile('/guide.md', 1);
      graph.addEdge('/README.md', '/guide.md');

      const ordered = graph.getFilesInDependencyOrder();

      // guide.md should come before README.md
      const readmeIndex = ordered.indexOf('/README.md');
      const guideIndex = ordered.indexOf('/guide.md');
      expect(guideIndex).toBeLessThan(readmeIndex);

      // CONTRIBUTING.md should be included
      expect(ordered).toContain('/CONTRIBUTING.md');
    });

    it('should handle cycles gracefully', () => {
      const graph = new DocGraph();
      graph.addFile('/a.md', 0);
      graph.addFile('/b.md', 1);
      graph.addFile('/c.md', 2);
      graph.addEdge('/a.md', '/b.md');
      graph.addEdge('/b.md', '/c.md');
      graph.addEdge('/c.md', '/a.md'); // cycle

      const ordered = graph.getFilesInDependencyOrder();

      // Should include all files without infinite loop
      expect(ordered).toHaveLength(3);
      expect(ordered).toContain('/a.md');
      expect(ordered).toContain('/b.md');
      expect(ordered).toContain('/c.md');
    });

    it('should handle disconnected components', () => {
      const graph = new DocGraph();
      graph.addFile('/README.md', 0);
      graph.addFile('/guide.md', 1);
      graph.addFile('/orphan.md', 0);
      graph.addEdge('/README.md', '/guide.md');
      // orphan.md is not connected

      const ordered = graph.getFilesInDependencyOrder();

      // Should include all files
      expect(ordered).toHaveLength(3);
      expect(ordered).toContain('/README.md');
      expect(ordered).toContain('/guide.md');
      expect(ordered).toContain('/orphan.md');
    });

    it('should handle broken links (edges to non-existent files)', () => {
      const graph = new DocGraph();
      graph.addFile('/README.md', 0);
      graph.addEdge('/README.md', '/missing.md'); // broken link

      const ordered = graph.getFilesInDependencyOrder();

      // Should include only existing files
      expect(ordered).toEqual(['/README.md']);
    });

    it('should return empty array for empty graph', () => {
      const graph = new DocGraph();
      const ordered = graph.getFilesInDependencyOrder();
      expect(ordered).toEqual([]);
    });

    it('should return single file for graph with one file', () => {
      const graph = new DocGraph();
      graph.addFile('/README.md', 0);
      const ordered = graph.getFilesInDependencyOrder();
      expect(ordered).toEqual(['/README.md']);
    });
  });
});
