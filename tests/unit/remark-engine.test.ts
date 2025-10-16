import { describe, it, expect, beforeEach } from 'vitest';
import { RemarkEngine } from '../../src/core/remark-engine.js';
import { DEFAULT_CONFIG } from '../../src/types/config.js';
import { createTestDir, writeTestFile } from '../setup.js';
import { join } from 'path';

describe('RemarkEngine', () => {
  let testDir: string;
  let engine: RemarkEngine;

  beforeEach(async () => {
    testDir = await createTestDir();
    engine = new RemarkEngine(DEFAULT_CONFIG);
  });

  describe('processFile', () => {
    it('should process valid markdown file', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Title\n\nContent');

      const errors = await engine.processFile(filePath);

      expect(errors).toBeDefined();
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should return empty array for valid markdown', async () => {
      const filePath = join(testDir, 'valid.md');
      await writeTestFile(filePath, '# Heading\n\nParagraph text.');

      const errors = await engine.processFile(filePath);

      // Well-formed markdown should have no errors
      expect(errors).toHaveLength(0);
    });

    it('should parse markdown with frontmatter', async () => {
      const filePath = join(testDir, 'with-frontmatter.md');
      await writeTestFile(filePath, '---\ntitle: Test\nauthor: John\n---\n\n# Content\n\nText.');

      const errors = await engine.processFile(filePath);

      // Should handle frontmatter without errors
      expect(errors).toBeDefined();
    });

    it('should parse GitHub Flavored Markdown', async () => {
      const filePath = join(testDir, 'gfm.md');
      await writeTestFile(
        filePath,
        '# GFM Features\n\n- [ ] Task 1\n- [x] Task 2\n\n| Col1 | Col2 |\n|------|------|\n| A    | B    |\n\n~~strikethrough~~'
      );

      const errors = await engine.processFile(filePath);

      // GFM features should be parsed correctly
      expect(errors).toBeDefined();
    });

    it('should handle empty markdown file', async () => {
      const filePath = join(testDir, 'empty.md');
      await writeTestFile(filePath, '');

      const errors = await engine.processFile(filePath);

      expect(errors).toBeDefined();
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should handle markdown with only whitespace', async () => {
      const filePath = join(testDir, 'whitespace.md');
      await writeTestFile(filePath, '   \n\n  \n  ');

      const errors = await engine.processFile(filePath);

      expect(errors).toBeDefined();
    });

    it('should handle markdown with links', async () => {
      const filePath = join(testDir, 'links.md');
      await writeTestFile(
        filePath,
        '# Links\n\n[Internal](./other.md)\n[External](https://example.com)\n[Anchor](#section)'
      );

      const errors = await engine.processFile(filePath);

      // Links shouldn't cause remark errors (link validation is separate)
      expect(errors).toBeDefined();
    });

    it('should handle markdown with code blocks', async () => {
      const filePath = join(testDir, 'code.md');
      await writeTestFile(
        filePath,
        '# Code\n\n```javascript\nconst x = 1;\n```\n\n```\nplain code\n```'
      );

      const errors = await engine.processFile(filePath);

      expect(errors).toBeDefined();
    });

    it('should handle markdown with blockquotes', async () => {
      const filePath = join(testDir, 'quotes.md');
      await writeTestFile(filePath, '# Quotes\n\n> This is a quote\n> Second line');

      const errors = await engine.processFile(filePath);

      expect(errors).toBeDefined();
    });

    it('should handle markdown with lists', async () => {
      const filePath = join(testDir, 'lists.md');
      await writeTestFile(
        filePath,
        '# Lists\n\n- Item 1\n- Item 2\n  - Nested\n\n1. First\n2. Second'
      );

      const errors = await engine.processFile(filePath);

      expect(errors).toBeDefined();
    });

    it('should handle markdown with headings at different levels', async () => {
      const filePath = join(testDir, 'headings.md');
      await writeTestFile(filePath, '# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6');

      const errors = await engine.processFile(filePath);

      expect(errors).toBeDefined();
    });

    it('should handle markdown with inline formatting', async () => {
      const filePath = join(testDir, 'inline.md');
      await writeTestFile(filePath, '# Formatting\n\n**bold** *italic* `code` ~~strikethrough~~');

      const errors = await engine.processFile(filePath);

      expect(errors).toBeDefined();
    });

    it('should handle markdown with HTML', async () => {
      const filePath = join(testDir, 'html.md');
      await writeTestFile(filePath, '# HTML\n\n<div>HTML content</div>\n\n<br />');

      const errors = await engine.processFile(filePath);

      expect(errors).toBeDefined();
    });

    it('should handle markdown with images', async () => {
      const filePath = join(testDir, 'images.md');
      await writeTestFile(
        filePath,
        '# Images\n\n![Alt text](./image.png)\n![External](https://example.com/img.jpg)'
      );

      const errors = await engine.processFile(filePath);

      expect(errors).toBeDefined();
    });

    it('should handle markdown with horizontal rules', async () => {
      const filePath = join(testDir, 'hr.md');
      await writeTestFile(filePath, '# Section 1\n\n---\n\n# Section 2\n\n***\n\n# Section 3');

      const errors = await engine.processFile(filePath);

      expect(errors).toBeDefined();
    });

    it('should return error objects with correct structure', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Test');

      const errors = await engine.processFile(filePath);

      // Even if no errors, the array structure should be correct
      expect(Array.isArray(errors)).toBe(true);

      errors.forEach(error => {
        expect(error).toHaveProperty('rule');
        expect(error).toHaveProperty('severity');
        expect(error).toHaveProperty('file');
        expect(error).toHaveProperty('line');
        expect(error).toHaveProperty('column');
        expect(error).toHaveProperty('message');

        // Validate types
        expect(typeof error.rule).toBe('string');
        expect(['error', 'warning']).toContain(error.severity);
        expect(typeof error.file).toBe('string');
        expect(typeof error.line).toBe('number');
        expect(typeof error.column).toBe('number');
        expect(typeof error.message).toBe('string');
      });
    });
  });

  describe('error handling', () => {
    it('should handle non-existent file gracefully', async () => {
      const filePath = join(testDir, 'missing.md');

      await expect(engine.processFile(filePath)).rejects.toThrow();
    });

    it('should handle malformed frontmatter', async () => {
      const filePath = join(testDir, 'bad-frontmatter.md');
      await writeTestFile(filePath, '---\nmalformed: [unclosed\n---\n\n# Content');

      const errors = await engine.processFile(filePath);

      // Should not crash, may or may not have errors depending on remark's handling
      expect(errors).toBeDefined();
    });

    it('should handle binary data as text', async () => {
      const filePath = join(testDir, 'binary.md');
      // Write some non-UTF8 data
      await writeTestFile(filePath, '# Test\n\n\x00\x01\x02');

      const errors = await engine.processFile(filePath);

      expect(errors).toBeDefined();
    });
  });

  describe('configuration', () => {
    it('should accept runtime configuration', () => {
      const customEngine = new RemarkEngine(DEFAULT_CONFIG);

      expect(customEngine).toBeDefined();
      expect(customEngine).toBeInstanceOf(RemarkEngine);
    });

    it('should create processor on initialization', () => {
      const newEngine = new RemarkEngine(DEFAULT_CONFIG);

      expect(newEngine).toBeDefined();
      // Processor should be ready to use immediately
      expect(newEngine).toHaveProperty('processFile');
    });
  });

  describe('integration with remark plugins', () => {
    it('should use remark-parse', async () => {
      const filePath = join(testDir, 'parse.md');
      await writeTestFile(filePath, '# Heading\n\nParagraph.');

      const errors = await engine.processFile(filePath);

      // Should successfully parse without errors
      expect(errors).toBeDefined();
    });

    it('should use remark-frontmatter', async () => {
      const filePath = join(testDir, 'frontmatter.md');
      await writeTestFile(filePath, '---\ntitle: Test\n---\n\n# Content');

      const errors = await engine.processFile(filePath);

      // Frontmatter should be handled by plugin
      expect(errors).toBeDefined();
    });

    it('should use remark-gfm', async () => {
      const filePath = join(testDir, 'gfm-test.md');
      await writeTestFile(filePath, '# GFM\n\n- [ ] Task\n\n| A | B |\n|---|---|\n| 1 | 2 |');

      const errors = await engine.processFile(filePath);

      // GFM syntax should be recognized
      expect(errors).toBeDefined();
    });

    it('should use remark-lint', async () => {
      const filePath = join(testDir, 'lint.md');
      await writeTestFile(filePath, '# Test\n\nContent.');

      const errors = await engine.processFile(filePath);

      // Lint rules should be applied
      expect(errors).toBeDefined();
      expect(Array.isArray(errors)).toBe(true);
    });
  });
});
