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
});
