import { describe, it, expect, beforeEach } from 'vitest';
import { DocLinter } from '../../src/core/doc-linter.js';
import { DEFAULT_CONFIG } from '../../src/types/config.js';
import { Logger } from '../../src/utils/logger.js';
import { createTestDir, writeTestFile } from '../setup.js';
import { join } from 'path';

describe('DocLinter', () => {
  let testDir: string;
  let logger: Logger;

  beforeEach(async () => {
    testDir = await createTestDir();
    logger = new Logger(false); // Disable colors for testing
  });

  describe('lint', () => {
    it('should return no errors for valid docs', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide\n\nContent');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true); // quiet mode

      expect(results.errorCount).toBe(0);
      expect(results.warningCount).toBe(0);
      expect(results.hasErrors()).toBe(false);
    });

    it('should detect orphaned files', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      expect(results.orphans).toHaveLength(1);
      expect(results.orphans[0]).toContain('orphan.md');
      expect(results.errorCount).toBeGreaterThan(0);
    });

    it('should detect broken file links', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Missing](./missing.md)\n[Guide](./guide.md)'
      );
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      expect(results.linkErrors.length).toBeGreaterThan(0);
      const deadLinks = results.linkErrors.filter(e => e.rule === 'dead-link');
      expect(deadLinks.length).toBeGreaterThan(0);
    });

    it('should detect broken anchor links', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Missing Section](#missing)\n[Valid Section](#main)'
      );

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      expect(results.linkErrors.length).toBeGreaterThan(0);
      const deadAnchors = results.linkErrors.filter(e => e.rule === 'dead-anchor');
      expect(deadAnchors.length).toBeGreaterThan(0);
    });

    it('should detect cross-file broken anchors', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Guide Section](./guide.md#missing)'
      );
      await writeTestFile(join(testDir, 'guide.md'), '# Guide\n\n## Section');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      expect(results.linkErrors.length).toBeGreaterThan(0);
      const deadAnchors = results.linkErrors.filter(e => e.rule === 'dead-anchor');
      expect(deadAnchors.length).toBeGreaterThan(0);
    });

    it('should handle empty directory', async () => {
      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      expect(results.errorCount).toBe(0);
      expect(results.warningCount).toBe(0);
    });

    it('should handle missing entrypoint', async () => {
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      // All files should be orphans if entrypoint doesn't exist
      expect(results.orphans).toHaveLength(1);
    });

    it('should build complete dependency graph', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide\n\n[API](./api.md)');
      await writeTestFile(join(testDir, 'api.md'), '# API');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      expect(results.orphans).toHaveLength(0);
      expect(results.linkErrors).toHaveLength(0);
      expect(results.errorCount).toBe(0);
    });

    it('should handle circular references', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide\n\n[Main](./README.md)');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      expect(results.errorCount).toBe(0);
      expect(results.orphans).toHaveLength(0);
    });

    it('should validate all reachable files', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide\n\n[API](./api.md)');
      await writeTestFile(join(testDir, 'api.md'), '# API\n\n[Missing](#missing)\n[Valid](#api)');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      // Should detect broken anchor in api.md
      expect(results.linkErrors.length).toBeGreaterThan(0);
    });

    it('should aggregate multiple error types', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Missing](./missing.md)\n[Broken Anchor](#missing)'
      );
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      expect(results.orphans.length).toBeGreaterThan(0);
      expect(results.linkErrors.length).toBeGreaterThan(0);
      expect(results.errorCount).toBeGreaterThan(2);
    });

    it('should respect quiet mode', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);

      // Quiet mode should not log
      const results = await linter.lint(testDir, true);
      expect(results).toBeDefined();

      // Non-quiet mode should log (we can't easily test console output, but we can verify it doesn't error)
      const results2 = await linter.lint(testDir, false);
      expect(results2).toBeDefined();
    });
  });

  describe('configuration handling', () => {
    it('should use provided configuration', async () => {
      await writeTestFile(join(testDir, 'docs.md'), '# Docs');

      const customConfig = {
        ...DEFAULT_CONFIG,
        entrypoint: 'docs.md',
      };

      const linter = new DocLinter(customConfig, logger);
      const results = await linter.lint(testDir, true);

      expect(results.orphans).toHaveLength(0);
    });

    it('should use custom logger', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');

      const customLogger = new Logger(true); // Enable colors
      const linter = new DocLinter(DEFAULT_CONFIG, customLogger);
      const results = await linter.lint(testDir, true);

      expect(results).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle files with no links', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\nJust text, no links.');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      expect(results.errorCount).toBe(0);
      expect(results.orphans).toHaveLength(0);
    });

    it('should handle files with only external links', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Google](https://google.com)\n[GitHub](https://github.com)'
      );

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      expect(results.errorCount).toBe(0);
    });

    it('should handle files with only anchor links', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Section](#main)');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      expect(results.errorCount).toBe(0);
    });

    it('should handle nested directory structures', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./docs/guide.md)');
      await writeTestFile(join(testDir, 'docs/guide.md'), '# Guide\n\n[API](./api/index.md)');
      await writeTestFile(join(testDir, 'docs/api/index.md'), '# API');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      expect(results.errorCount).toBe(0);
      expect(results.orphans).toHaveLength(0);
    });

    it('should handle markdown files in subdirectories as orphans', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'docs/orphan.md'), '# Orphan');

      const linter = new DocLinter(DEFAULT_CONFIG, logger);
      const results = await linter.lint(testDir, true);

      expect(results.orphans.length).toBeGreaterThan(0);
    });
  });
});
