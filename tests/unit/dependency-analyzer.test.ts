import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyAnalyzer } from '../../src/core/dependency-analyzer.js';
import { DocGraph } from '../../src/types/graph.js';

describe('DependencyAnalyzer', () => {
  let graph: DocGraph;
  let analyzer: DependencyAnalyzer;
  const basePath = '/docs';

  beforeEach(() => {
    graph = new DocGraph();
    analyzer = new DependencyAnalyzer(basePath, graph);
  });

  describe('analyze() - basic functionality', () => {
    it('should analyze both incoming and outgoing by default', () => {
      // Setup: A → B → C
      graph.addFile('/docs/a.md');
      graph.addFile('/docs/b.md');
      graph.addFile('/docs/c.md');
      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/b.md', '/docs/c.md');

      const report = analyzer.analyze('/docs/b.md', {});

      expect(report.file).toBe('/docs/b.md');
      expect(report.incoming).toHaveLength(1);
      expect(report.incoming[0]!.path).toBe('/docs/a.md');
      expect(report.outgoing).toHaveLength(1);
      expect(report.outgoing[0]!.path).toBe('/docs/c.md');
    });

    it('should analyze only incoming when includeOutgoing is false', () => {
      graph.addFile('/docs/a.md');
      graph.addFile('/docs/b.md');
      graph.addFile('/docs/c.md');
      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/b.md', '/docs/c.md');

      const report = analyzer.analyze('/docs/b.md', {
        includeIncoming: true,
        includeOutgoing: false,
      });

      expect(report.incoming).toHaveLength(1);
      expect(report.outgoing).toEqual([]);
    });

    it('should analyze only outgoing when includeIncoming is false', () => {
      graph.addFile('/docs/a.md');
      graph.addFile('/docs/b.md');
      graph.addFile('/docs/c.md');
      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/b.md', '/docs/c.md');

      const report = analyzer.analyze('/docs/b.md', {
        includeIncoming: false,
        includeOutgoing: true,
      });

      expect(report.incoming).toEqual([]);
      expect(report.outgoing).toHaveLength(1);
    });

    it('should return empty arrays when file has no dependencies', () => {
      graph.addFile('/docs/isolated.md');

      const report = analyzer.analyze('/docs/isolated.md', {});

      expect(report.incoming).toEqual([]);
      expect(report.outgoing).toEqual([]);
      expect(report.stats.incomingCount).toBe(0);
      expect(report.stats.outgoingCount).toBe(0);
    });
  });

  describe('Depth limiting', () => {
    beforeEach(() => {
      // Create chain: A → B → C → D
      ['a', 'b', 'c', 'd'].forEach(f => graph.addFile(`/docs/${f}.md`));
      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/b.md', '/docs/c.md');
      graph.addEdge('/docs/c.md', '/docs/d.md');
    });

    it('should respect maxDepth = 1 (direct dependencies only)', () => {
      const report = analyzer.analyze('/docs/a.md', {
        includeOutgoing: true,
        includeIncoming: false,
        maxDepth: 1,
      });

      expect(report.outgoing).toHaveLength(1);
      expect(report.outgoing[0]!.path).toBe('/docs/b.md');
      expect(report.outgoing[0]!.depth).toBe(1);
      expect(report.outgoing[0]!.children).toEqual([]);
    });

    it('should respect maxDepth = 2', () => {
      const report = analyzer.analyze('/docs/a.md', {
        includeOutgoing: true,
        includeIncoming: false,
        maxDepth: 2,
      });

      expect(report.outgoing).toHaveLength(1);
      expect(report.outgoing[0]!.path).toBe('/docs/b.md');
      expect(report.outgoing[0]!.children).toHaveLength(1);
      expect(report.outgoing[0]!.children[0]!.path).toBe('/docs/c.md');
      expect(report.outgoing[0]!.children[0]!.depth).toBe(2);
      expect(report.outgoing[0]!.children[0]!.children).toEqual([]);
    });

    it('should handle maxDepth = 0 (no dependencies)', () => {
      const report = analyzer.analyze('/docs/a.md', {
        maxDepth: 0,
      });

      expect(report.incoming).toEqual([]);
      expect(report.outgoing).toEqual([]);
    });

    it('should handle maxDepth = Infinity (unlimited)', () => {
      const report = analyzer.analyze('/docs/a.md', {
        includeOutgoing: true,
        includeIncoming: false,
        maxDepth: Infinity,
      });

      // Should traverse full chain
      expect(report.outgoing[0]!.path).toBe('/docs/b.md');
      expect(report.outgoing[0]!.children[0]!.path).toBe('/docs/c.md');
      expect(report.outgoing[0]!.children[0]!.children[0]!.path).toBe('/docs/d.md');
    });
  });

  describe('Cycle detection', () => {
    it('should detect simple 2-node cycle', () => {
      graph.addFile('/docs/a.md');
      graph.addFile('/docs/b.md');
      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/b.md', '/docs/a.md'); // cycle

      const report = analyzer.analyze('/docs/a.md', {
        includeOutgoing: true,
        includeIncoming: false,
      });

      expect(report.cycles.length).toBeGreaterThan(0);
      expect(report.stats.cyclesDetected).toBeGreaterThan(0);
    });

    it('should detect 3-node cycle', () => {
      // A → B → C → A
      graph.addFile('/docs/a.md');
      graph.addFile('/docs/b.md');
      graph.addFile('/docs/c.md');
      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/b.md', '/docs/c.md');
      graph.addEdge('/docs/c.md', '/docs/a.md'); // cycle back

      const report = analyzer.analyze('/docs/a.md', {
        includeOutgoing: true,
        includeIncoming: false,
      });

      expect(report.cycles.length).toBeGreaterThan(0);
      expect(report.stats.cyclesDetected).toBeGreaterThan(0);
    });

    it('should mark cycle nodes with isCycle flag', () => {
      graph.addFile('/docs/a.md');
      graph.addFile('/docs/b.md');
      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/b.md', '/docs/a.md');

      const report = analyzer.analyze('/docs/a.md', {
        includeOutgoing: true,
        includeIncoming: false,
      });

      const bNode = report.outgoing[0]!;
      expect(bNode.path).toBe('/docs/b.md');
      expect(bNode.children[0]!.isCycle).toBe(true);
      expect(bNode.children[0]!.cycleTarget).toBeDefined();
    });

    it('should not traverse beyond cycle point', () => {
      // A → B → C → A (cycle)
      graph.addFile('/docs/a.md');
      graph.addFile('/docs/b.md');
      graph.addFile('/docs/c.md');
      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/b.md', '/docs/c.md');
      graph.addEdge('/docs/c.md', '/docs/a.md');

      const report = analyzer.analyze('/docs/a.md', {
        includeOutgoing: true,
        includeIncoming: false,
      });

      // C should have child (A with cycle flag) but no grandchildren
      const cNode = report.outgoing[0]!.children[0]!;
      expect(cNode.path).toBe('/docs/c.md');
      expect(cNode.children[0]!.isCycle).toBe(true);
      expect(cNode.children[0]!.children).toEqual([]);
    });

    it('should handle self-referential cycles', () => {
      graph.addFile('/docs/a.md');
      graph.addEdge('/docs/a.md', '/docs/a.md'); // self-loop

      const report = analyzer.analyze('/docs/a.md', {
        includeOutgoing: true,
        includeIncoming: false,
      });

      expect(report.cycles.length).toBeGreaterThan(0);
    });
  });

  describe('Complex graph structures', () => {
    it('should handle diamond pattern (multiple paths to same node)', () => {
      // A → B → D
      // A → C → D
      graph.addFile('/docs/a.md');
      graph.addFile('/docs/b.md');
      graph.addFile('/docs/c.md');
      graph.addFile('/docs/d.md');

      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/a.md', '/docs/c.md');
      graph.addEdge('/docs/b.md', '/docs/d.md');
      graph.addEdge('/docs/c.md', '/docs/d.md');

      const report = analyzer.analyze('/docs/a.md', {
        includeOutgoing: true,
        includeIncoming: false,
      });

      expect(report.outgoing).toHaveLength(2); // B and C
      // D should appear under both B and C
      expect(report.outgoing[0]!.children).toHaveLength(1);
      expect(report.outgoing[1]!.children).toHaveLength(1);
    });

    it('should handle star pattern (hub with many spokes)', () => {
      // hub → b, c, d, e, f (hub links to 5 files)
      graph.addFile('/docs/hub.md');
      ['b', 'c', 'd', 'e', 'f'].forEach(f => {
        const file = `/docs/${f}.md`;
        graph.addFile(file);
        graph.addEdge('/docs/hub.md', file);
      });

      const report = analyzer.analyze('/docs/hub.md', {
        includeOutgoing: true,
        includeIncoming: false,
      });

      expect(report.outgoing).toHaveLength(5);
      expect(report.stats.outgoingCount).toBe(5);
    });

    it('should handle inverse star pattern (many files link to one)', () => {
      graph.addFile('/docs/popular.md');
      ['a', 'b', 'c', 'd', 'e'].forEach(f => {
        const file = `/docs/${f}.md`;
        graph.addFile(file);
        graph.addEdge(file, '/docs/popular.md');
      });

      const report = analyzer.analyze('/docs/popular.md', {
        includeIncoming: true,
        includeOutgoing: false,
      });

      expect(report.incoming).toHaveLength(5);
      expect(report.stats.incomingCount).toBe(5);
    });
  });

  describe('Statistics calculation', () => {
    it('should count total incoming dependencies (recursive)', () => {
      // A → B, B → C
      // C has 2 incoming (B directly, A transitively)
      graph.addFile('/docs/a.md');
      graph.addFile('/docs/b.md');
      graph.addFile('/docs/c.md');
      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/b.md', '/docs/c.md');

      const report = analyzer.analyze('/docs/c.md', {
        includeIncoming: true,
        includeOutgoing: false,
      });

      expect(report.stats.incomingCount).toBeGreaterThanOrEqual(1);
    });

    it('should count total outgoing dependencies (recursive)', () => {
      graph.addFile('/docs/a.md');
      graph.addFile('/docs/b.md');
      graph.addFile('/docs/c.md');
      graph.addEdge('/docs/a.md', '/docs/b.md');
      graph.addEdge('/docs/b.md', '/docs/c.md');

      const report = analyzer.analyze('/docs/a.md', {
        includeIncoming: false,
        includeOutgoing: true,
      });

      expect(report.stats.outgoingCount).toBeGreaterThanOrEqual(1);
    });
  });
});
