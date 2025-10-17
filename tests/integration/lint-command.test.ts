import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDir, writeTestFile } from '../setup.js';
import { join } from 'path';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('lint command (integration)', () => {
  let testDir: string;
  let cliPath: string;

  beforeEach(async () => {
    testDir = await createTestDir();
    cliPath = path.resolve(process.cwd(), 'dist/src/index.js');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  function runCli(args: string[]): {
    stdout: string;
    stderr: string;
    exitCode: number;
  } {
    const { spawnSync } = require('child_process');
    const result = spawnSync('node', [cliPath, ...args], {
      cwd: testDir,
      encoding: 'utf-8',
    });

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.status || 0,
    };
  }

  describe('orphan detection', () => {
    it('should detect orphaned files', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('orphan.md');
      expect(result.stdout).toContain('Orphaned file');
    });

    it('should not report false orphans', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      // Success message now goes to stderr
      expect(result.stderr).toContain('No issues found');
    });

    it('should detect multiple orphans', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'orphan1.md'), '# Orphan 1');
      await writeTestFile(join(testDir, 'orphan2.md'), '# Orphan 2');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('orphan1.md');
      expect(result.stdout).toContain('orphan2.md');
    });
  });

  describe('depth-limited orphan detection', () => {
    it('should skip orphan detection when using --depth', async () => {
      // Create a chain: README -> level1 -> level2 -> level3
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Level1](./level1.md)');
      await writeTestFile(join(testDir, 'level1.md'), '# Level 1\n\n[Level2](./level2.md)');
      await writeTestFile(join(testDir, 'level2.md'), '# Level 2\n\n[Level3](./level3.md)');
      await writeTestFile(join(testDir, 'level3.md'), '# Level 3');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      const result = runCli(['lint', '--depth', '1']);

      // Should pass (no false orphans)
      expect(result.exitCode).toBe(0);
      // Should show warning about skipping orphan detection
      expect(result.stderr).toContain('Skipping orphan detection');
      expect(result.stderr).toContain('depth-limited graph');
      // Should NOT report level2, level3, or orphan as orphans
      expect(result.stdout).not.toContain('level2.md');
      expect(result.stdout).not.toContain('level3.md');
      expect(result.stdout).not.toContain('Orphaned file');
    });

    it('should skip orphan detection with depth 0', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');

      const result = runCli(['lint', '--depth', '0']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('Skipping orphan detection');
      // Should only find README (depth 0)
      expect(result.stderr).toContain('Found 1 reachable files');
    });

    it('should still detect orphans with --depth unlimited', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      const result = runCli(['lint', '--depth', 'unlimited']);

      expect(result.exitCode).toBe(1);
      // Should NOT show skipping message
      expect(result.stderr).not.toContain('Skipping orphan detection');
      // Should detect true orphan
      expect(result.stdout).toContain('orphan.md');
      expect(result.stdout).toContain('Orphaned file');
    });

    it('should validate links correctly with depth limit', async () => {
      // Ensure link validation still works with depth limiting
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Broken](./missing.md)');

      const result = runCli(['lint', '--depth', '1']);

      // Should still detect broken link
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Dead link');
      expect(result.stdout).toContain('missing.md');
    });

    it('should not report false orphans at depth 2', async () => {
      // Test various depth levels
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[L1](./level1.md)');
      await writeTestFile(join(testDir, 'level1.md'), '# Level 1\n\n[L2](./level2.md)');
      await writeTestFile(join(testDir, 'level2.md'), '# Level 2\n\n[L3](./level3.md)');
      await writeTestFile(join(testDir, 'level3.md'), '# Level 3');

      const result = runCli(['lint', '--depth', '2']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('Skipping orphan detection');
      expect(result.stderr).toContain('Found 3 reachable files'); // README, level1, level2
      // level3 is beyond depth but should not be reported as orphan
      expect(result.stdout).not.toContain('level3.md');
    });
  });

  describe('link validation', () => {
    it('should detect broken links', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Broken](./missing.md)');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Dead link');
      expect(result.stdout).toContain('missing.md');
    });

    it('should validate links across multiple files', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide\n\n[API](./api.md)');
      await writeTestFile(join(testDir, 'api.md'), '# API');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      // Success message now goes to stderr
      expect(result.stderr).toContain('No issues found');
    });

    it('should validate relative paths', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./docs/guide.md)');
      await writeTestFile(join(testDir, 'docs/guide.md'), '# Guide');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      // Success message now goes to stderr
      expect(result.stderr).toContain('No issues found');
    });
  });

  describe('anchor validation', () => {
    it('should detect broken anchors', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Section](#missing-section)');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Dead anchor');
      expect(result.stdout).toContain('missing-section');
    });

    it('should validate anchors in same file', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Section](#section)\n\n## Section'
      );

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      // Success message now goes to stderr
      expect(result.stderr).toContain('No issues found');
    });

    it('should validate anchors in other files', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Guide Section](./guide.md#installation)'
      );
      await writeTestFile(join(testDir, 'guide.md'), '# Guide\n\n## Installation');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      // Success message now goes to stderr
      expect(result.stderr).toContain('No issues found');
    });
  });

  describe('output formats', () => {
    it('should output JSON format', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      const result = runCli(['lint', '--format', 'json']);

      expect(result.exitCode).toBe(1);
      const results = JSON.parse(result.stdout);
      expect(Array.isArray(results)).toBe(true);
      expect(results[0]).toHaveProperty('rule');
      expect(results[0]).toHaveProperty('severity');
      expect(results[0]).toHaveProperty('file');
    });

    it('should output text format by default', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      // Success message now goes to stderr
      expect(result.stderr).toContain('No issues found');
    });
  });

  // Note: Custom entrypoint option not yet implemented in CLI
  // Would require adding --entrypoint flag to lint command

  describe('exit codes', () => {
    it('should exit with 0 for no errors', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
    });

    it('should exit with 1 for errors', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Broken](./missing.md)');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(1);
    });
  });
});
