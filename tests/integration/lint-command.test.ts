import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDir, writeTestFile } from '../setup.js';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('lint command (integration)', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await createTestDir();
  });

  describe('orphan detection', () => {
    it('should detect orphaned files', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      try {
        await execAsync(`node dist/src/index.js lint ${testDir}`, {
          cwd: '/workspace/repo',
        });
        // Should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.stdout).toContain('orphan.md');
        expect(error.stdout).toContain('Orphaned file');
      }
    });

    it('should not report false orphans', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');

      const { stdout } = await execAsync(`node dist/src/index.js lint ${testDir}`, {
        cwd: '/workspace/repo',
      });

      expect(stdout).toContain('No issues found');
    });

    it('should detect multiple orphans', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'orphan1.md'), '# Orphan 1');
      await writeTestFile(join(testDir, 'orphan2.md'), '# Orphan 2');

      try {
        await execAsync(`node dist/src/index.js lint ${testDir}`, {
          cwd: '/workspace/repo',
        });
      } catch (error: any) {
        expect(error.stdout).toContain('orphan1.md');
        expect(error.stdout).toContain('orphan2.md');
      }
    });
  });

  describe('link validation', () => {
    it('should detect broken links', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Broken](./missing.md)');

      try {
        await execAsync(`node dist/src/index.js lint ${testDir}`, {
          cwd: '/workspace/repo',
        });
      } catch (error: any) {
        expect(error.stdout).toContain('Dead link');
        expect(error.stdout).toContain('missing.md');
      }
    });

    it('should validate links across multiple files', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide\n\n[API](./api.md)');
      await writeTestFile(join(testDir, 'api.md'), '# API');

      const { stdout } = await execAsync(`node dist/src/index.js lint ${testDir}`, {
        cwd: '/workspace/repo',
      });

      expect(stdout).toContain('No issues found');
    });

    it('should validate relative paths', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./docs/guide.md)');
      await writeTestFile(join(testDir, 'docs/guide.md'), '# Guide');

      const { stdout } = await execAsync(`node dist/src/index.js lint ${testDir}`, {
        cwd: '/workspace/repo',
      });

      expect(stdout).toContain('No issues found');
    });
  });

  describe('anchor validation', () => {
    it('should detect broken anchors', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Section](#missing-section)');

      try {
        await execAsync(`node dist/src/index.js lint ${testDir}`, {
          cwd: '/workspace/repo',
        });
      } catch (error: any) {
        expect(error.stdout).toContain('Dead anchor');
        expect(error.stdout).toContain('missing-section');
      }
    });

    it('should validate anchors in same file', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Section](#section)\n\n## Section'
      );

      const { stdout } = await execAsync(`node dist/src/index.js lint ${testDir}`, {
        cwd: '/workspace/repo',
      });

      expect(stdout).toContain('No issues found');
    });

    it('should validate anchors in other files', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Guide Section](./guide.md#installation)'
      );
      await writeTestFile(join(testDir, 'guide.md'), '# Guide\n\n## Installation');

      const { stdout } = await execAsync(`node dist/src/index.js lint ${testDir}`, {
        cwd: '/workspace/repo',
      });

      expect(stdout).toContain('No issues found');
    });
  });

  describe('output formats', () => {
    it('should output JSON format', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      try {
        await execAsync(`node dist/src/index.js lint ${testDir} --format json`, {
          cwd: '/workspace/repo',
        });
      } catch (error: any) {
        const results = JSON.parse(error.stdout);
        expect(Array.isArray(results)).toBe(true);
        expect(results[0]).toHaveProperty('rule');
        expect(results[0]).toHaveProperty('severity');
        expect(results[0]).toHaveProperty('file');
      }
    });

    it('should output text format by default', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');

      const { stdout } = await execAsync(`node dist/src/index.js lint ${testDir}`, {
        cwd: '/workspace/repo',
      });

      expect(stdout).toContain('No issues found');
    });
  });

  // Note: Custom entrypoint option not yet implemented in CLI
  // Would require adding --entrypoint flag to lint command

  describe('exit codes', () => {
    it('should exit with 0 for no errors', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');

      const { code } = await execAsync(`node dist/src/index.js lint ${testDir}`, {
        cwd: '/workspace/repo',
      }).then(
        () => ({ code: 0 }),
        () => ({ code: 1 })
      );

      expect(code).toBe(0);
    });

    it('should exit with 1 for errors', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Broken](./missing.md)');

      const { code } = await execAsync(`node dist/src/index.js lint ${testDir}`, {
        cwd: '/workspace/repo',
      }).then(
        () => ({ code: 0 }),
        () => ({ code: 1 })
      );

      expect(code).toBe(1);
    });
  });
});
