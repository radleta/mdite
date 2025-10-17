import { describe, it, expect, beforeEach } from 'vitest';
import { GraphAnalyzer } from '../../src/core/graph-analyzer.js';
import { DEFAULT_CONFIG } from '../../src/types/config.js';
import { createTestDir, writeTestFile } from '../setup.js';
import { join } from 'path';

describe('GraphAnalyzer', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await createTestDir();
  });

  describe('buildGraph', () => {
    it('should build graph from single file', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Title\n\nContent');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();

      expect(graph.getAllFiles()).toHaveLength(1);
      expect(graph.hasFile(join(testDir, 'README.md'))).toBe(true);
    });

    it('should follow links and build connected graph', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide\n\n[API](./api.md)');
      await writeTestFile(join(testDir, 'api.md'), '# API');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();

      expect(graph.getAllFiles()).toHaveLength(3);
      expect(graph.hasFile(join(testDir, 'README.md'))).toBe(true);
      expect(graph.hasFile(join(testDir, 'guide.md'))).toBe(true);
      expect(graph.hasFile(join(testDir, 'api.md'))).toBe(true);
    });

    it('should handle circular references', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide\n\n[Back to Main](./README.md)');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();

      expect(graph.getAllFiles()).toHaveLength(2);
    });

    it('should ignore external links', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[External](https://example.com)\n[Internal](./guide.md)'
      );
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();

      expect(graph.getAllFiles()).toHaveLength(2);
    });

    it('should ignore anchor-only links', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Section](#section)\n[Guide](./guide.md)'
      );
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();

      expect(graph.getAllFiles()).toHaveLength(2);
    });

    it('should handle links with anchors', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Guide Section](./guide.md#section)'
      );
      await writeTestFile(join(testDir, 'guide.md'), '# Guide\n\n## Section');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();

      expect(graph.getAllFiles()).toHaveLength(2);
      expect(graph.hasFile(join(testDir, 'guide.md'))).toBe(true);
    });

    it('should skip non-markdown links', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Image](./image.png)\n[PDF](./doc.pdf)'
      );

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();

      expect(graph.getAllFiles()).toHaveLength(1);
    });

    it('should handle nested directory structure', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./docs/guide.md)');
      await writeTestFile(join(testDir, 'docs/guide.md'), '# Guide\n\n[API](./api/index.md)');
      await writeTestFile(join(testDir, 'docs/api/index.md'), '# API');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();

      expect(graph.getAllFiles()).toHaveLength(3);
    });
  });

  describe('findOrphans', () => {
    it('should detect orphaned files', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();
      const orphans = await analyzer.findOrphans(graph);

      expect(orphans).toHaveLength(1);
      expect(orphans[0]).toContain('orphan.md');
    });

    it('should return empty array when no orphans exist', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();
      const orphans = await analyzer.findOrphans(graph);

      expect(orphans).toHaveLength(0);
    });

    it('should detect multiple orphans', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'orphan1.md'), '# Orphan 1');
      await writeTestFile(join(testDir, 'orphan2.md'), '# Orphan 2');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();
      const orphans = await analyzer.findOrphans(graph);

      expect(orphans).toHaveLength(2);
    });

    it('should return empty array when isDepthLimited is true', async () => {
      // Files beyond depth limit should not be reported as orphans
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Level1](./level1.md)');
      await writeTestFile(join(testDir, 'level1.md'), '# Level 1\n\n[Level2](./level2.md)');
      await writeTestFile(join(testDir, 'level2.md'), '# Level 2');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph(1); // Depth 1: only README and level1

      // With isDepthLimited=true, should return empty array (skip orphan detection)
      const orphans = await analyzer.findOrphans(graph, true);
      expect(orphans).toHaveLength(0);
    });

    it('should detect orphans when isDepthLimited is false', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();

      // With isDepthLimited=false (default), should detect orphans normally
      const orphans = await analyzer.findOrphans(graph, false);
      expect(orphans).toHaveLength(1);
      expect(orphans[0]).toContain('orphan.md');
    });

    it('should use default parameter (false) when isDepthLimited not provided', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();

      // Without providing isDepthLimited, should default to false (normal orphan detection)
      const orphans = await analyzer.findOrphans(graph);
      expect(orphans).toHaveLength(1);
      expect(orphans[0]).toContain('orphan.md');
    });
  });

  describe('edge cases', () => {
    it('should handle missing entrypoint gracefully', async () => {
      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();

      expect(graph.getAllFiles()).toHaveLength(0);
    });

    it('should handle broken links gracefully', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Broken](./missing.md)');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();

      // Should still add README, but skip missing file
      expect(graph.getAllFiles()).toHaveLength(1);
    });

    it('should handle empty markdown files', async () => {
      await writeTestFile(join(testDir, 'README.md'), '');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraph();

      expect(graph.getAllFiles()).toHaveLength(1);
    });
  });

  describe('buildGraphFromMultiple', () => {
    it('should build graph from multiple entrypoints', async () => {
      // Setup: A.md -> C.md, B.md -> D.md
      await writeTestFile(join(testDir, 'A.md'), '# A\n\n[C](./C.md)');
      await writeTestFile(join(testDir, 'B.md'), '# B\n\n[D](./D.md)');
      await writeTestFile(join(testDir, 'C.md'), '# C');
      await writeTestFile(join(testDir, 'D.md'), '# D');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraphFromMultiple(['A.md', 'B.md'], Infinity);

      expect(graph.getAllFiles()).toHaveLength(4);
      expect(graph.hasFile(join(testDir, 'A.md'))).toBe(true);
      expect(graph.hasFile(join(testDir, 'B.md'))).toBe(true);
      expect(graph.hasFile(join(testDir, 'C.md'))).toBe(true);
      expect(graph.hasFile(join(testDir, 'D.md'))).toBe(true);
    });

    it('should use minimum depth for files in multiple graphs', async () => {
      // Setup: A.md -> B.md -> C.md, and C.md as direct entrypoint
      await writeTestFile(join(testDir, 'A.md'), '# A\n\n[B](./B.md)');
      await writeTestFile(join(testDir, 'B.md'), '# B\n\n[C](./C.md)');
      await writeTestFile(join(testDir, 'C.md'), '# C');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraphFromMultiple(['A.md', 'C.md'], Infinity);

      expect(graph.getDepth(join(testDir, 'A.md'))).toBe(0); // entry point
      expect(graph.getDepth(join(testDir, 'B.md'))).toBe(1); // from A
      expect(graph.getDepth(join(testDir, 'C.md'))).toBe(0); // entry point (minimum depth)
    });

    it('should respect depth limit per entrypoint', async () => {
      // A.md -> B.md -> C.md
      await writeTestFile(join(testDir, 'A.md'), '# A\n\n[B](./B.md)');
      await writeTestFile(join(testDir, 'B.md'), '# B\n\n[C](./C.md)');
      await writeTestFile(join(testDir, 'C.md'), '# C');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraphFromMultiple(['A.md'], 1);

      expect(graph.hasFile(join(testDir, 'A.md'))).toBe(true);
      expect(graph.hasFile(join(testDir, 'B.md'))).toBe(true);
      expect(graph.hasFile(join(testDir, 'C.md'))).toBe(false); // beyond depth 1
    });

    it('should handle overlapping graphs correctly', async () => {
      // A.md -> shared.md, B.md -> shared.md
      await writeTestFile(join(testDir, 'A.md'), '# A\n\n[Shared](./shared.md)');
      await writeTestFile(join(testDir, 'B.md'), '# B\n\n[Shared](./shared.md)');
      await writeTestFile(join(testDir, 'shared.md'), '# Shared');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraphFromMultiple(['A.md', 'B.md'], Infinity);

      expect(graph.getAllFiles()).toHaveLength(3);
      expect(graph.getDepth(join(testDir, 'shared.md'))).toBe(1); // depth 1 from both
    });

    it('should handle circular references in multi-entrypoint graphs', async () => {
      // A.md <-> B.md (circular)
      await writeTestFile(join(testDir, 'A.md'), '# A\n\n[B](./B.md)');
      await writeTestFile(join(testDir, 'B.md'), '# B\n\n[A](./A.md)');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraphFromMultiple(['A.md', 'B.md'], Infinity);

      expect(graph.getAllFiles()).toHaveLength(2);
      expect(graph.getDepth(join(testDir, 'A.md'))).toBe(0);
      expect(graph.getDepth(join(testDir, 'B.md'))).toBe(0);
    });

    it('should handle missing entrypoint files gracefully', async () => {
      await writeTestFile(join(testDir, 'A.md'), '# A');

      const analyzer = new GraphAnalyzer(testDir, DEFAULT_CONFIG);
      const graph = await analyzer.buildGraphFromMultiple(['A.md', 'missing.md'], Infinity);

      // Should only include A.md, skip missing
      expect(graph.getAllFiles()).toHaveLength(1);
      expect(graph.hasFile(join(testDir, 'A.md'))).toBe(true);
    });
  });
});
