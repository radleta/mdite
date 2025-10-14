import { describe, it, expect } from 'vitest';
import { DocGraph } from '../../src/types/graph.js';

describe('DocGraph', () => {
  it('adds files', () => {
    const graph = new DocGraph();
    graph.addFile('/path/to/file.md');

    expect(graph.hasFile('/path/to/file.md')).toBe(true);
    expect(graph.getAllFiles()).toEqual(['/path/to/file.md']);
  });

  it('adds edges', () => {
    const graph = new DocGraph();
    graph.addFile('/path/from.md');
    graph.addFile('/path/to.md');
    graph.addEdge('/path/from.md', '/path/to.md');

    expect(graph.getOutgoingLinks('/path/from.md')).toEqual(['/path/to.md']);
  });

  it('returns empty array for file with no outgoing links', () => {
    const graph = new DocGraph();
    graph.addFile('/path/file.md');

    expect(graph.getOutgoingLinks('/path/file.md')).toEqual([]);
  });

  it('returns empty array for non-existent file', () => {
    const graph = new DocGraph();

    expect(graph.getOutgoingLinks('/path/nonexistent.md')).toEqual([]);
  });

  it('handles multiple files and edges', () => {
    const graph = new DocGraph();
    graph.addFile('/a.md');
    graph.addFile('/b.md');
    graph.addFile('/c.md');
    graph.addEdge('/a.md', '/b.md');
    graph.addEdge('/a.md', '/c.md');

    expect(graph.getAllFiles()).toHaveLength(3);
    expect(graph.getOutgoingLinks('/a.md')).toHaveLength(2);
  });
});
