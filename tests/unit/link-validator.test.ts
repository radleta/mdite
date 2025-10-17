import { describe, it, expect, beforeEach } from 'vitest';
import { LinkValidator } from '../../src/core/link-validator.js';
import { DocGraph } from '../../src/types/graph.js';
import { createTestDir, writeTestFile } from '../setup.js';
import { join } from 'path';

describe('LinkValidator', () => {
  let testDir: string;
  let graph: DocGraph;

  beforeEach(async () => {
    testDir = await createTestDir();
    graph = new DocGraph();
  });

  describe('validate', () => {
    it('should return no errors for valid links', async () => {
      const readme = join(testDir, 'README.md');
      const guide = join(testDir, 'guide.md');

      await writeTestFile(readme, '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(guide, '# Guide');

      graph.addFile(readme, 0);
      graph.addFile(guide, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors).toHaveLength(0);
    });

    it('should detect dead file links', async () => {
      const readme = join(testDir, 'README.md');

      await writeTestFile(readme, '# Main\n\n[Missing](./missing.md)');
      graph.addFile(readme, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors).toHaveLength(1);
      expect(errors[0]!.rule).toBe('dead-link');
      expect(errors[0]!.message).toContain('missing.md');
    });

    it('should detect dead anchors', async () => {
      const readme = join(testDir, 'README.md');

      await writeTestFile(readme, '# Main\n\n[Section](#nonexistent)');
      graph.addFile(readme, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors).toHaveLength(1);
      expect(errors[0]!.rule).toBe('dead-anchor');
      expect(errors[0]!.message).toContain('nonexistent');
    });

    it('should validate anchors in same file', async () => {
      const readme = join(testDir, 'README.md');

      await writeTestFile(readme, '# Main\n\n[Section](#section)\n\n## Section');
      graph.addFile(readme, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors).toHaveLength(0);
    });

    it('should validate anchors in different files', async () => {
      const readme = join(testDir, 'README.md');
      const guide = join(testDir, 'guide.md');

      await writeTestFile(readme, '# Main\n\n[Guide Section](./guide.md#installation)');
      await writeTestFile(guide, '# Guide\n\n## Installation');

      graph.addFile(readme, 0);
      graph.addFile(guide, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors).toHaveLength(0);
    });

    it('should skip external links', async () => {
      const readme = join(testDir, 'README.md');

      await writeTestFile(readme, '# Main\n\n[External](https://example.com)');
      graph.addFile(readme, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors).toHaveLength(0);
    });

    it('should handle multiple errors in same file', async () => {
      const readme = join(testDir, 'README.md');

      await writeTestFile(
        readme,
        '# Main\n\n[Missing1](./missing1.md)\n\n[Missing2](./missing2.md)'
      );
      graph.addFile(readme, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should include line and column numbers', async () => {
      const readme = join(testDir, 'README.md');

      await writeTestFile(readme, '# Main\n\n[Missing](./missing.md)');
      graph.addFile(readme, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors[0]!.line).toBeGreaterThan(0);
      expect(errors[0]!.column).toBeGreaterThan(0);
    });
  });

  describe('anchor slug matching', () => {
    it('should match heading with correct slug format', async () => {
      const readme = join(testDir, 'README.md');

      await writeTestFile(readme, '# Main\n\n[Link](#my-section)\n\n## My Section');
      graph.addFile(readme, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors).toHaveLength(0);
    });

    it('should handle headings with special characters', async () => {
      const readme = join(testDir, 'README.md');

      await writeTestFile(readme, '# Main\n\n[Link](#api-v20)\n\n## API v2.0');
      graph.addFile(readme, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors).toHaveLength(0);
    });

    it('should handle headings with multiple words', async () => {
      const readme = join(testDir, 'README.md');

      await writeTestFile(
        readme,
        '# Main\n\n[Link](#getting-started-guide)\n\n## Getting Started Guide'
      );
      graph.addFile(readme, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty files', async () => {
      const readme = join(testDir, 'README.md');

      await writeTestFile(readme, '');
      graph.addFile(readme, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors).toHaveLength(0);
    });

    it('should handle files with no links', async () => {
      const readme = join(testDir, 'README.md');

      await writeTestFile(readme, '# Main\n\nJust some text.');
      graph.addFile(readme, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors).toHaveLength(0);
    });

    it('should validate multiple files', async () => {
      const readme = join(testDir, 'README.md');
      const guide = join(testDir, 'guide.md');

      await writeTestFile(readme, '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(guide, '# Guide\n\n[Missing](./missing.md)');

      graph.addFile(readme, 0);
      graph.addFile(guide, 0);

      const validator = new LinkValidator(testDir, graph);
      const errors = await validator.validate();

      expect(errors).toHaveLength(1);
      expect(errors[0]!.file).toBe(guide);
    });
  });
});
