import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('files command (integration)', () => {
  let testDir: string;
  const cliPath = path.join(process.cwd(), 'dist/src/index.js');

  beforeEach(async () => {
    testDir = path.join(process.cwd(), `test-temp-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  function runFiles(args: string[]): {
    stdout: string;
    stderr: string;
    exitCode: number;
  } {
    const result = spawnSync('node', [cliPath, 'files', ...args], {
      cwd: testDir,
      encoding: 'utf-8',
    });

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.status || 0,
    };
  }

  describe('Basic functionality', () => {
    it('should list all reachable files', async () => {
      await fs.writeFile(path.join(testDir, 'README.md'), '# Test\n\n[Guide](./guide.md)');
      await fs.writeFile(path.join(testDir, 'guide.md'), '# Guide\n\nContent');

      const result = runFiles([]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('README.md');
      expect(result.stdout).toContain('guide.md');
    });

    it('should support --absolute flag', async () => {
      await fs.writeFile(path.join(testDir, 'README.md'), '# Test');

      const result = runFiles(['--absolute']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(testDir);
      expect(result.stdout).toContain('README.md');
    });

    it('should list orphaned files with --orphans', async () => {
      await fs.writeFile(path.join(testDir, 'README.md'), '# Test');
      await fs.writeFile(path.join(testDir, 'orphan.md'), '# Orphan');

      const result = runFiles(['--orphans']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('orphan.md');
      expect(result.stdout).not.toContain('README.md');
    });
  });

  describe('Depth filtering', () => {
    beforeEach(async () => {
      await fs.writeFile(
        path.join(testDir, 'README.md'),
        '# Test\n\n[Guide](./guide.md)\n[API](./api.md)'
      );
      await fs.writeFile(path.join(testDir, 'guide.md'), '# Guide\n\n[Setup](./setup.md)');
      await fs.writeFile(path.join(testDir, 'api.md'), '# API');
      await fs.writeFile(path.join(testDir, 'setup.md'), '# Setup');
    });

    it('should limit files by depth', async () => {
      const result = runFiles(['--depth', '1']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('README.md');
      expect(result.stdout).toContain('guide.md');
      expect(result.stdout).toContain('api.md');
      expect(result.stdout).not.toContain('setup.md'); // depth 2
    });

    it('should show only entrypoint with --depth 0', async () => {
      const result = runFiles(['--depth', '0']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('README.md');
      expect(result.stdout).not.toContain('guide.md');
      expect(result.stdout).not.toContain('api.md');
    });
  });

  describe('Frontmatter filtering', () => {
    beforeEach(async () => {
      await fs.writeFile(
        path.join(testDir, 'README.md'),
        '---\nstatus: published\n---\n# Test\n\n[Draft](./draft.md)\n[Guide](./guide.md)'
      );
      await fs.writeFile(
        path.join(testDir, 'draft.md'),
        '---\nstatus: draft\n---\n# Draft\n\nContent'
      );
      await fs.writeFile(
        path.join(testDir, 'guide.md'),
        '---\nstatus: published\ntags:\n  - api\n  - reference\n---\n# Guide'
      );
    });

    it('should filter by frontmatter status', async () => {
      const result = runFiles(['--frontmatter', "status == 'published'"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('README.md');
      expect(result.stdout).toContain('guide.md');
      expect(result.stdout).not.toContain('draft.md');
    });

    it('should filter by frontmatter tags', async () => {
      const result = runFiles(['--frontmatter', "contains(tags, 'api')"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('guide.md');
      expect(result.stdout).not.toContain('README.md');
      expect(result.stdout).not.toContain('draft.md');
    });
  });

  describe('Output formats', () => {
    beforeEach(async () => {
      await fs.writeFile(path.join(testDir, 'README.md'), '# Test\n\n[Guide](./guide.md)');
      await fs.writeFile(path.join(testDir, 'guide.md'), '# Guide');
    });

    it('should output JSON format', async () => {
      const result = runFiles(['--format', 'json']);

      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout);
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
      expect(json[0]).toHaveProperty('file');
      expect(json[0]).toHaveProperty('depth');
      expect(json[0]).toHaveProperty('orphan');
    });

    it('should annotate with depth using --with-depth', async () => {
      const result = runFiles(['--with-depth']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/0 .*README\.md/);
      expect(result.stdout).toMatch(/1 .*guide\.md/);
    });

    it('should output null-separated with --print0', async () => {
      const result = runFiles(['--print0']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('\0');
      expect(result.stdout).not.toContain('\n');
    });
  });

  describe('Sorting', () => {
    beforeEach(async () => {
      await fs.writeFile(
        path.join(testDir, 'README.md'),
        '# Root\n\n[A](./a.md)\n[B](./b.md)\n[C](./c.md)'
      );
      await fs.writeFile(path.join(testDir, 'a.md'), '# A\n\n[B](./b.md)\n[C](./c.md)');
      await fs.writeFile(path.join(testDir, 'b.md'), '# B\n\n[C](./c.md)');
      await fs.writeFile(path.join(testDir, 'c.md'), '# C');
    });

    it('should sort alphabetically by default', async () => {
      const result = runFiles([]);

      expect(result.exitCode).toBe(0);
      const lines = result.stdout.trim().split('\n');
      expect(lines).toEqual(['README.md', 'a.md', 'b.md', 'c.md']);
    });

    it('should sort by depth with --sort depth', async () => {
      const result = runFiles(['--sort', 'depth']);

      expect(result.exitCode).toBe(0);
      const lines = result.stdout.trim().split('\n');
      expect(lines[0]).toBe('README.md'); // depth 0
    });

    it('should sort by incoming links with --sort incoming', async () => {
      const result = runFiles(['--sort', 'incoming']);

      expect(result.exitCode).toBe(0);
      const lines = result.stdout.trim().split('\n');
      // c.md has most incoming links (3)
      expect(lines[0]).toBe('c.md');
    });

    it('should sort by outgoing links with --sort outgoing', async () => {
      const result = runFiles(['--sort', 'outgoing']);

      expect(result.exitCode).toBe(0);
      const lines = result.stdout.trim().split('\n');
      // README.md has most outgoing links (3)
      expect(lines[0]).toBe('README.md');
    });
  });

  describe('Error handling', () => {
    it('should error on invalid format', async () => {
      await fs.writeFile(path.join(testDir, 'README.md'), '# Test');

      const result = runFiles(['--format', 'invalid']);

      expect(result.exitCode).toBe(2); // USAGE_ERROR
    });

    it('should error on invalid sort option', async () => {
      await fs.writeFile(path.join(testDir, 'README.md'), '# Test');

      const result = runFiles(['--sort', 'invalid']);

      expect(result.exitCode).toBe(2); // USAGE_ERROR
    });

    it('should error on invalid depth value', async () => {
      await fs.writeFile(path.join(testDir, 'README.md'), '# Test');

      const result = runFiles(['--depth', 'invalid']);

      expect(result.exitCode).toBe(2); // USAGE_ERROR
    });
  });

  describe('Stdout/stderr separation', () => {
    it('should output file list to stdout and messages to stderr', async () => {
      await fs.writeFile(path.join(testDir, 'README.md'), '# Test');

      const result = runFiles(['--verbose']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('README.md');
      expect(result.stderr).toContain('Building dependency graph');
    });

    it('should suppress messages in quiet mode', async () => {
      await fs.writeFile(path.join(testDir, 'README.md'), '# Test');

      const result = runFiles(['--quiet']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('README.md');
      expect(result.stderr).not.toContain('Building');
    });
  });
});
