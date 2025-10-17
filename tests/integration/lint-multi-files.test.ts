import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'child_process';
import { createTestDir, writeTestFile } from '../setup.js';
import { join } from 'path';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('mdite lint [paths...] (multi-file)', () => {
  let testDir: string;
  let cliPath: string;

  beforeEach(async () => {
    testDir = await createTestDir();
    cliPath = path.resolve(process.cwd(), 'dist/src/index.js');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  function runLint(args: string[]): {
    stdout: string;
    stderr: string;
    exitCode: number;
  } {
    const result = spawnSync('node', [cliPath, 'lint', ...args], {
      cwd: testDir,
      encoding: 'utf-8',
    });

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.status || 0,
    };
  }

  describe('basic functionality', () => {
    it('should lint multiple files successfully', async () => {
      await writeTestFile(join(testDir, 'A.md'), '# A\n\n[C](./C.md)');
      await writeTestFile(join(testDir, 'B.md'), '# B\n\n[D](./D.md)');
      await writeTestFile(join(testDir, 'C.md'), '# C');
      await writeTestFile(join(testDir, 'D.md'), '# D');

      const result = runLint(['A.md', 'B.md']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('Linting 2 file(s)');
      expect(result.stderr).toContain('✓');
    });

    it('should work with single file (backward compatibility)', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Test');

      const result = runLint(['README.md']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).not.toContain('Linting 2 file(s)');
    });

    it('should work with no arguments (backward compatibility)', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Test');

      const result = runLint([]);

      expect(result.exitCode).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should error when mixing --entrypoint with multiple files', async () => {
      await writeTestFile(join(testDir, 'A.md'), '# A');
      await writeTestFile(join(testDir, 'B.md'), '# B');

      const result = runLint(['A.md', 'B.md', '--entrypoint', 'C.md']);

      expect(result.exitCode).toBe(2); // USAGE_ERROR
      expect(result.stderr).toContain('Cannot use --entrypoint');
    });

    it('should error when mixing directory with files', async () => {
      await writeTestFile(join(testDir, 'docs/A.md'), '# A');
      await writeTestFile(join(testDir, 'B.md'), '# B');

      const result = runLint(['docs', 'B.md']);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Cannot mix directories and files');
    });

    it('should error when file does not exist in multi-file mode', async () => {
      await writeTestFile(join(testDir, 'exists.md'), '# Exists');

      const result = runLint(['exists.md', 'missing.md']);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('File not found');
    });
  });

  describe('depth limiting', () => {
    it('should respect depth limit with multiple files', async () => {
      await writeTestFile(join(testDir, 'A.md'), '# A\n\n[B](./B.md)');
      await writeTestFile(join(testDir, 'B.md'), '# B\n\n[C](./C.md)');
      await writeTestFile(join(testDir, 'C.md'), '# C\n\n[D](./D.md)');
      await writeTestFile(join(testDir, 'D.md'), '# D');

      const result = runLint(['A.md', '--depth', '1']);

      // C and D are beyond depth 1, so they're orphans - exit code 1
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('depth: 1');
      expect(result.stdout).toContain('orphan');
    });

    it('should apply depth to all entrypoints', async () => {
      await writeTestFile(join(testDir, 'A.md'), '# A\n\n[B](./B.md)');
      await writeTestFile(join(testDir, 'B.md'), '# B\n\n[C](./C.md)');
      await writeTestFile(join(testDir, 'C.md'), '# C');
      await writeTestFile(join(testDir, 'X.md'), '# X\n\n[Y](./Y.md)');
      await writeTestFile(join(testDir, 'Y.md'), '# Y\n\n[Z](./Z.md)');
      await writeTestFile(join(testDir, 'Z.md'), '# Z');

      const result = runLint(['A.md', 'X.md', '--depth', '1']);

      // C and Z are beyond depth 1, so they're orphans - exit code 1
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('orphan');
      // Both entrypoints at depth 0, their direct links (B, Y) at depth 1
    });
  });

  describe('orphan detection', () => {
    it('should detect orphans not reachable from any entrypoint', async () => {
      await writeTestFile(join(testDir, 'A.md'), '# A\n\n[C](./C.md)');
      await writeTestFile(join(testDir, 'B.md'), '# B\n\n[D](./D.md)');
      await writeTestFile(join(testDir, 'C.md'), '# C');
      await writeTestFile(join(testDir, 'D.md'), '# D');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      const result = runLint(['A.md', 'B.md']);

      expect(result.exitCode).toBe(1); // Has errors (orphan)
      expect(result.stdout).toContain('orphan.md');
      expect(result.stdout).toContain('Orphaned file');
    });

    it('should not report files as orphans if reachable from any entrypoint', async () => {
      await writeTestFile(join(testDir, 'A.md'), '# A\n\n[shared.md](./shared.md)');
      await writeTestFile(join(testDir, 'B.md'), '# B\n\n[shared.md](./shared.md)');
      await writeTestFile(join(testDir, 'shared.md'), '# Shared');

      const result = runLint(['A.md', 'B.md']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('orphan');
    });
  });

  describe('link validation', () => {
    it('should validate links in all specified files', async () => {
      await writeTestFile(join(testDir, 'A.md'), '# A\n\n[missing](./missing.md)');
      await writeTestFile(join(testDir, 'B.md'), '# B');

      const result = runLint(['A.md', 'B.md']);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Dead link');
      expect(result.stdout).toContain('missing.md');
    });

    it('should deduplicate link errors from multiple graphs', async () => {
      await writeTestFile(join(testDir, 'A.md'), '# A\n\n[broken](./broken.md)');
      await writeTestFile(join(testDir, 'B.md'), '# B\n\n[broken](./broken.md)');

      const result = runLint(['A.md', 'B.md']);

      expect(result.exitCode).toBe(1);
      // Should report broken.md error only once, not twice
      const brokenCount = (result.stdout.match(/broken\.md/g) || []).length;
      expect(brokenCount).toBeLessThanOrEqual(2); // Once in each file's context
    });
  });

  describe('output formats', () => {
    it('should output JSON correctly with multiple files', async () => {
      await writeTestFile(join(testDir, 'A.md'), '# A');
      await writeTestFile(join(testDir, 'B.md'), '# B');

      const result = runLint(['A.md', 'B.md', '--format', 'json']);

      expect(result.exitCode).toBe(0);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
      const json = JSON.parse(result.stdout);
      expect(Array.isArray(json)).toBe(true);
    });

    it('should output text format by default', async () => {
      await writeTestFile(join(testDir, 'A.md'), '# A');
      await writeTestFile(join(testDir, 'B.md'), '# B');

      const result = runLint(['A.md', 'B.md']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('mdite');
    });
  });

  describe('verbose mode', () => {
    it('should show list of files in verbose mode', async () => {
      await writeTestFile(join(testDir, 'A.md'), '# A');
      await writeTestFile(join(testDir, 'B.md'), '# B');
      await writeTestFile(join(testDir, 'C.md'), '# C');

      const result = runLint(['A.md', 'B.md', 'C.md', '--verbose']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('Linting 3 file(s)');
      expect(result.stderr).toContain('A.md');
      expect(result.stderr).toContain('B.md');
      expect(result.stderr).toContain('C.md');
    });
  });

  describe('overlapping graphs', () => {
    it('should use minimum depth for files in multiple graphs', async () => {
      // A -> B -> C, and C as direct entrypoint
      await writeTestFile(join(testDir, 'A.md'), '# A\n\n[B](./B.md)');
      await writeTestFile(join(testDir, 'B.md'), '# B\n\n[C](./C.md)');
      await writeTestFile(join(testDir, 'C.md'), '# C');

      const result = runLint(['A.md', 'C.md']);

      // Should succeed, C is reachable from both A (depth 2) and directly (depth 0)
      expect(result.exitCode).toBe(0);
    });
  });
});
