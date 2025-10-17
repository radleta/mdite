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
});
