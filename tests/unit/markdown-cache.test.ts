import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownCache } from '../../src/core/markdown-cache.js';
import { createTestDir, writeTestFile } from '../setup.js';
import { join } from 'path';

describe('MarkdownCache', () => {
  let testDir: string;
  let cache: MarkdownCache;

  beforeEach(async () => {
    testDir = await createTestDir();
    cache = new MarkdownCache();
  });

  describe('getContent', () => {
    it('should read and cache file content', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Test Content\n\nBody text');

      const content1 = await cache.getContent(filePath);
      const content2 = await cache.getContent(filePath);

      expect(content1).toBe('# Test Content\n\nBody text');
      expect(content2).toBe(content1); // Same instance
    });

    it('should cache multiple files independently', async () => {
      const file1 = join(testDir, 'file1.md');
      const file2 = join(testDir, 'file2.md');

      await writeTestFile(file1, '# File 1');
      await writeTestFile(file2, '# File 2');

      const content1 = await cache.getContent(file1);
      const content2 = await cache.getContent(file2);

      expect(content1).toBe('# File 1');
      expect(content2).toBe('# File 2');
    });

    it('should throw error for non-existent file', async () => {
      const filePath = join(testDir, 'missing.md');

      await expect(cache.getContent(filePath)).rejects.toThrow();
    });
  });

  describe('getAST', () => {
    it('should parse and cache AST', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Heading\n\nParagraph');

      const ast1 = await cache.getAST(filePath);
      const ast2 = await cache.getAST(filePath);

      expect(ast1.type).toBe('root');
      expect(ast1.children).toHaveLength(2); // heading + paragraph
      expect(ast2).toBe(ast1); // Same instance from cache
    });

    it('should parse markdown correctly', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Title\n\n[Link](./other.md)');

      const ast = await cache.getAST(filePath);

      expect(ast.type).toBe('root');
      expect(ast.children).toHaveLength(2);

      // First child should be heading
      const heading = ast.children[0];
      expect(heading).toBeDefined();
      expect(heading?.type).toBe('heading');

      // Second child should be paragraph with link
      const paragraph = ast.children[1];
      expect(paragraph).toBeDefined();
      expect(paragraph?.type).toBe('paragraph');
    });

    it('should reuse content cache when getting AST', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Test');

      // Get content first
      await cache.getContent(filePath);

      // Get AST should reuse cached content
      const ast = await cache.getAST(filePath);

      expect(ast.type).toBe('root');
    });
  });

  describe('getHeadings', () => {
    it('should extract and cache heading slugs', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Main Title\n\n## Subsection\n\n### Deep Heading');

      const headings1 = await cache.getHeadings(filePath);
      const headings2 = await cache.getHeadings(filePath);

      expect(headings1).toEqual(['main-title', 'subsection', 'deep-heading']);
      expect(headings2).toBe(headings1); // Same instance from cache
    });

    it('should handle files with no headings', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, 'Just plain text, no headings.');

      const headings = await cache.getHeadings(filePath);

      expect(headings).toEqual([]);
    });

    it('should slugify headings correctly', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(
        filePath,
        '# Get Started!\n\n## Multiple   Spaces\n\n### Special@#$Characters'
      );

      const headings = await cache.getHeadings(filePath);

      expect(headings).toEqual(['get-started', 'multiple-spaces', 'specialcharacters']);
    });

    it('should handle headings with inline code and emphasis', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# API Reference\n\n## `function` Call');

      const headings = await cache.getHeadings(filePath);

      expect(headings).toContain('api-reference');
    });

    it('should reuse AST cache when getting headings', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Title\n\n## Subtitle');

      // Get AST first
      await cache.getAST(filePath);

      // Get headings should reuse cached AST
      const headings = await cache.getHeadings(filePath);

      expect(headings).toEqual(['title', 'subtitle']);
    });
  });

  describe('getLinks', () => {
    it('should extract and cache relative markdown links', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Title\n\n[Guide](./guide.md)\n[API](./api.md)');

      const links1 = await cache.getLinks(filePath);
      const links2 = await cache.getLinks(filePath);

      expect(links1).toEqual(['./guide.md', './api.md']);
      expect(links2).toBe(links1); // Same instance from cache
    });

    it('should strip anchors from links', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '[Section](./guide.md#section)\n[Method](./api.md#methods)');

      const links = await cache.getLinks(filePath);

      expect(links).toEqual(['./guide.md', './api.md']);
    });

    it('should ignore external links', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '[External](https://example.com)\n[Internal](./guide.md)');

      const links = await cache.getLinks(filePath);

      expect(links).toEqual(['./guide.md']);
    });

    it('should ignore anchor-only links', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '[Section](#section)\n[File](./guide.md)');

      const links = await cache.getLinks(filePath);

      expect(links).toEqual(['./guide.md']);
    });

    it('should ignore non-markdown links', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(
        filePath,
        '[Image](./image.png)\n[PDF](./doc.pdf)\n[Markdown](./guide.md)'
      );

      const links = await cache.getLinks(filePath);

      expect(links).toEqual(['./guide.md']);
    });

    it('should handle files with no links', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Title\n\nJust plain text.');

      const links = await cache.getLinks(filePath);

      expect(links).toEqual([]);
    });

    it('should reuse AST cache when getting links', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '[Link](./guide.md)');

      // Get AST first
      await cache.getAST(filePath);

      // Get links should reuse cached AST
      const links = await cache.getLinks(filePath);

      expect(links).toEqual(['./guide.md']);
    });
  });

  describe('clear', () => {
    it('should clear all caches', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Title\n\n[Link](./guide.md)');

      // Populate all caches
      await cache.getContent(filePath);
      await cache.getAST(filePath);
      await cache.getHeadings(filePath);
      await cache.getLinks(filePath);

      // Verify caches are populated
      let stats = cache.getStats();
      expect(stats.cachedFiles).toBe(1);

      // Clear caches
      cache.clear();

      // Verify caches are empty
      stats = cache.getStats();
      expect(stats.cachedFiles).toBe(0);
      expect(stats.cacheSize).toBe(0);
    });

    it('should allow re-population after clear', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Title');

      // Populate cache
      await cache.getContent(filePath);
      expect(cache.getStats().cachedFiles).toBe(1);

      // Clear
      cache.clear();
      expect(cache.getStats().cachedFiles).toBe(0);

      // Re-populate
      await cache.getContent(filePath);
      expect(cache.getStats().cachedFiles).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return zero for empty cache', () => {
      const stats = cache.getStats();

      expect(stats.cachedFiles).toBe(0);
      expect(stats.cacheSize).toBe(0);
    });

    it('should return correct stats for single file', async () => {
      const filePath = join(testDir, 'test.md');
      const content = '# Test Content\n\nBody';
      await writeTestFile(filePath, content);

      await cache.getContent(filePath);
      const stats = cache.getStats();

      expect(stats.cachedFiles).toBe(1);
      expect(stats.cacheSize).toBe(content.length);
    });

    it('should return correct stats for multiple files', async () => {
      const file1 = join(testDir, 'file1.md');
      const file2 = join(testDir, 'file2.md');
      const content1 = '# File 1';
      const content2 = '# File 2 with more content';

      await writeTestFile(file1, content1);
      await writeTestFile(file2, content2);

      await cache.getContent(file1);
      await cache.getContent(file2);

      const stats = cache.getStats();

      expect(stats.cachedFiles).toBe(2);
      expect(stats.cacheSize).toBe(content1.length + content2.length);
    });

    it('should update stats after clear', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Test');

      await cache.getContent(filePath);
      expect(cache.getStats().cachedFiles).toBe(1);

      cache.clear();
      const stats = cache.getStats();

      expect(stats.cachedFiles).toBe(0);
      expect(stats.cacheSize).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical graph building scenario', async () => {
      // Simulate graph building: multiple getLinks() calls
      const file1 = join(testDir, 'README.md');
      const file2 = join(testDir, 'guide.md');

      await writeTestFile(file1, '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(file2, '# Guide\n\n## Section');

      // First file: get links
      const links1 = await cache.getLinks(file1);
      expect(links1).toEqual(['./guide.md']);

      // Second file: get links
      const links2 = await cache.getLinks(file2);
      expect(links2).toEqual([]);

      // Stats should show 2 cached files
      const stats = cache.getStats();
      expect(stats.cachedFiles).toBe(2);
    });

    it('should handle typical link validation scenario', async () => {
      // Simulate link validation: getHeadings() calls
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Main\n\n## Section\n\n### Subsection');

      // Validate multiple anchors in same file
      const headings1 = await cache.getHeadings(filePath);
      const headings2 = await cache.getHeadings(filePath);
      const headings3 = await cache.getHeadings(filePath);

      // All calls should return same cached instance
      expect(headings2).toBe(headings1);
      expect(headings3).toBe(headings1);

      // Stats should show single file cached (not 3x)
      const stats = cache.getStats();
      expect(stats.cachedFiles).toBe(1);
    });

    it('should handle mixed operations efficiently', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Title\n\n[Link](./other.md)\n\n## Section');

      // Interleave different cache operations
      const content = await cache.getContent(filePath);
      const links = await cache.getLinks(filePath);
      const headings = await cache.getHeadings(filePath);
      const ast = await cache.getAST(filePath);

      // All should return valid results
      expect(content).toContain('# Title');
      expect(links).toEqual(['./other.md']);
      expect(headings).toEqual(['title', 'section']);
      expect(ast.type).toBe('root');

      // Should only cache file once
      const stats = cache.getStats();
      expect(stats.cachedFiles).toBe(1);
    });
  });
});
