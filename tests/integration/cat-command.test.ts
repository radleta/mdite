import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('cat command (integration)', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mdite-cat-'));
    cliPath = path.resolve(process.cwd(), 'dist/src/index.js');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function setupBasicFixture() {
    // README.md → guide.md → setup.md
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Root\n\n[Guide](guide.md)');
    await fs.writeFile(path.join(tempDir, 'guide.md'), '# Guide\n\n[Setup](setup.md)');
    await fs.writeFile(path.join(tempDir, 'setup.md'), '# Setup');
  }

  function runCli(args: string[]): {
    stdout: string;
    stderr: string;
    exitCode: number;
  } {
    const { spawnSync } = require('child_process');
    const result = spawnSync('node', [cliPath, ...args], {
      cwd: tempDir,
      encoding: 'utf-8',
    });

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.status || 0,
    };
  }

  describe('Basic functionality', () => {
    it('should output all files in dependency order by default', async () => {
      await setupBasicFixture();

      const result = runCli(['cat']);

      expect(result.exitCode).toBe(0);
      // Files should be in dependency order (dependencies first)
      expect(result.stdout).toContain('# Setup');
      expect(result.stdout).toContain('# Guide');
      expect(result.stdout).toContain('# Root');

      // Setup should come before Guide, Guide before Root
      const setupIndex = result.stdout.indexOf('# Setup');
      const guideIndex = result.stdout.indexOf('# Guide');
      const rootIndex = result.stdout.indexOf('# Root');

      expect(setupIndex).toBeLessThan(guideIndex);
      expect(guideIndex).toBeLessThan(rootIndex);
    });

    it('should output files in alphabetical order with --order alpha', async () => {
      await setupBasicFixture();

      const result = runCli(['cat', '--order', 'alpha']);

      expect(result.exitCode).toBe(0);
      // Files should be in alphabetical order
      const readmeIndex = result.stdout.indexOf('# Root');
      const guideIndex = result.stdout.indexOf('# Guide');
      const setupIndex = result.stdout.indexOf('# Setup');

      expect(readmeIndex).toBeLessThan(guideIndex);
      expect(guideIndex).toBeLessThan(setupIndex);
    });

    it('should use default separator between files', async () => {
      await setupBasicFixture();

      const result = runCli(['cat']);

      expect(result.exitCode).toBe(0);
      // Should have separator between files (2 newlines from separator + 1 from console.log = 3 total)
      expect(result.stdout).toContain('# Setup\n\n\n# Guide');
    });

    it('should use custom separator when provided', async () => {
      await setupBasicFixture();

      const result = runCli(['cat', '--separator', '\\n---\\n']);

      expect(result.exitCode).toBe(0);
      // Should have custom separator between files
      expect(result.stdout).toContain('\n---\n');
    });

    it('should not add separator after last file', async () => {
      await fs.writeFile(path.join(tempDir, 'README.md'), '# Only File\n');

      const result = runCli(['cat']);

      expect(result.exitCode).toBe(0);
      // Should not have trailing separator (just the newline from file content)
      expect(result.stdout).toBe('# Only File\n');
      // Should not have double newline after last file
      expect(result.stdout).not.toContain('# Only File\n\n\n');
    });
  });

  describe('JSON format', () => {
    it('should output files as JSON with --format json', async () => {
      await setupBasicFixture();

      const result = runCli(['cat', '--format', 'json']);

      expect(result.exitCode).toBe(0);

      // Should be valid JSON
      const parsed = JSON.parse(result.stdout);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(3);

      // Check structure of first item
      expect(parsed[0]).toHaveProperty('file');
      expect(parsed[0]).toHaveProperty('depth');
      expect(parsed[0]).toHaveProperty('content');
      expect(parsed[0]).toHaveProperty('wordCount');
      expect(parsed[0]).toHaveProperty('lineCount');
    });

    it('should include correct metadata in JSON output', async () => {
      await fs.writeFile(path.join(tempDir, 'README.md'), '# Test\n\nOne two three.');

      const result = runCli(['cat', '--format', 'json']);

      expect(result.exitCode).toBe(0);

      const parsed = JSON.parse(result.stdout);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].file).toBe('README.md');
      expect(parsed[0].depth).toBe(0);
      expect(parsed[0].content).toBe('# Test\n\nOne two three.');
      expect(parsed[0].wordCount).toBe(5); // "#", "Test", "One", "two", "three."
      expect(parsed[0].lineCount).toBe(3);
    });
  });

  describe('Error handling', () => {
    it('should fail with usage error for invalid format', async () => {
      await setupBasicFixture();

      const result = runCli(['cat', '--format', 'invalid']);

      expect(result.exitCode).toBe(2); // USAGE_ERROR
      expect(result.stderr).toContain('Invalid format');
    });

    it('should fail with usage error for invalid order', async () => {
      await setupBasicFixture();

      const result = runCli(['cat', '--order', 'invalid']);

      expect(result.exitCode).toBe(2); // USAGE_ERROR
      expect(result.stderr).toContain('Invalid order');
    });

    it('should handle empty graph gracefully', async () => {
      // No markdown files

      const result = runCli(['cat']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('No files to output');
    });
  });

  describe('Stdout/stderr separation', () => {
    it('should output content to stdout and messages to stderr', async () => {
      await setupBasicFixture();

      const result = runCli(['cat']);

      // Content goes to stdout
      expect(result.stdout).toContain('# Setup');
      expect(result.stdout).toContain('# Guide');
      expect(result.stdout).toContain('# Root');

      // Progress messages go to stderr
      expect(result.stderr).toContain('Building dependency graph');
      expect(result.stderr).toContain('Outputting');
    });

    it('should suppress messages in quiet mode', async () => {
      await setupBasicFixture();

      const result = runCli(['cat', '--quiet']);

      // Content still goes to stdout
      expect(result.stdout).toContain('# Setup');

      // Progress messages should not appear
      expect(result.stderr).not.toContain('Building dependency graph');
      expect(result.stderr).not.toContain('Outputting');
    });

    it('should be pipe-friendly', async () => {
      await setupBasicFixture();

      const result = runCli(['cat']);

      // Stdout should be pure content (pipe-friendly)
      expect(result.stdout).toContain('# Setup');
      expect(result.stdout).not.toContain('Building');
      expect(result.stdout).not.toContain('Outputting');
    });
  });

  describe('Multiple files and ordering', () => {
    it('should handle multiple files at same depth', async () => {
      await fs.writeFile(path.join(tempDir, 'README.md'), '# A\n\n[B](other.md)');
      await fs.writeFile(path.join(tempDir, 'other.md'), '# B');

      const result = runCli(['cat']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('# A');
      expect(result.stdout).toContain('# B');
    });

    it('should respect depth option from config', async () => {
      await setupBasicFixture();
      await fs.writeFile(path.join(tempDir, 'mdite.config.js'), 'module.exports = { depth: 1 };');

      const result = runCli(['cat']);

      expect(result.exitCode).toBe(0);
      // Should only include files up to depth 1 (README and guide, but not setup)
      expect(result.stdout).toContain('# Root');
      expect(result.stdout).toContain('# Guide');
      expect(result.stdout).not.toContain('# Setup');
    });
  });

  describe('Complex graph structures', () => {
    it('should handle cyclic dependencies', async () => {
      // a.md → b.md → c.md → a.md (cycle)
      await fs.writeFile(path.join(tempDir, 'README.md'), '# Root\n\n[A](a.md)');
      await fs.writeFile(path.join(tempDir, 'a.md'), '# A\n\n[B](b.md)');
      await fs.writeFile(path.join(tempDir, 'b.md'), '# B\n\n[C](c.md)');
      await fs.writeFile(path.join(tempDir, 'c.md'), '# C\n\n[A](a.md)');

      const result = runCli(['cat']);

      expect(result.exitCode).toBe(0);
      // Should include all files without hanging
      expect(result.stdout).toContain('# Root');
      expect(result.stdout).toContain('# A');
      expect(result.stdout).toContain('# B');
      expect(result.stdout).toContain('# C');
    });

    it('should handle deeply nested structure', async () => {
      await fs.writeFile(path.join(tempDir, 'README.md'), '# 0\n[1](1.md)');
      await fs.writeFile(path.join(tempDir, '1.md'), '# 1\n[2](2.md)');
      await fs.writeFile(path.join(tempDir, '2.md'), '# 2\n[3](3.md)');
      await fs.writeFile(path.join(tempDir, '3.md'), '# 3');

      const result = runCli(['cat']);

      expect(result.exitCode).toBe(0);
      // Should include all files in dependency order
      const idx0 = result.stdout.indexOf('# 0');
      const idx1 = result.stdout.indexOf('# 1');
      const idx2 = result.stdout.indexOf('# 2');
      const idx3 = result.stdout.indexOf('# 3');

      // Deepest first (3, 2, 1, 0)
      expect(idx3).toBeLessThan(idx2);
      expect(idx2).toBeLessThan(idx1);
      expect(idx1).toBeLessThan(idx0);
    });
  });
});
