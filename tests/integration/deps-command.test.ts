import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// Type for exec errors
interface ExecError extends Error {
  stdout?: string;
  stderr?: string;
  status?: number;
}

describe('deps command (integration)', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-lint-deps-'));
    cliPath = path.resolve(process.cwd(), 'dist/src/index.js');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function setupBasicFixture() {
    // README.md → guide.md → setup.md
    // README.md → api.md
    await fs.writeFile(
      path.join(tempDir, 'README.md'),
      '# Root\n\n[Guide](guide.md)\n[API](api.md)'
    );
    await fs.writeFile(path.join(tempDir, 'guide.md'), '# Guide\n\n[Setup](setup.md)');
    await fs.writeFile(path.join(tempDir, 'setup.md'), '# Setup');
    await fs.writeFile(path.join(tempDir, 'api.md'), '# API');
  }

  async function setupCyclicFixture() {
    // a.md → b.md → c.md → a.md (cycle)
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Root\n\n[A](a.md)');
    await fs.writeFile(path.join(tempDir, 'a.md'), '# A\n\n[B](b.md)');
    await fs.writeFile(path.join(tempDir, 'b.md'), '# B\n\n[C](c.md)');
    await fs.writeFile(path.join(tempDir, 'c.md'), '# C\n\n[A](a.md)');
  }

  function runCli(args: string[]): {
    stdout: string;
    stderr: string;
    exitCode: number;
  } {
    try {
      const stdout = execSync(`node "${cliPath}" ${args.join(' ')}`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { stdout, stderr: '', exitCode: 0 };
    } catch (error: unknown) {
      const execError = error as ExecError;
      return {
        stdout: execError.stdout || '',
        stderr: execError.stderr || '',
        exitCode: execError.status || 1,
      };
    }
  }

  describe('Basic functionality', () => {
    it('should show both incoming and outgoing by default', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', 'guide.md']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Incoming');
      expect(result.stdout).toContain('Outgoing');
      expect(result.stdout).toContain('README.md');
      expect(result.stdout).toContain('setup.md');
    });

    it('should show only incoming with --incoming flag', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', 'guide.md', '--incoming']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Incoming');
      expect(result.stdout).not.toContain('Outgoing');
      expect(result.stdout).toContain('README.md');
      expect(result.stdout).not.toContain('setup.md');
    });

    it('should show only outgoing with --outgoing flag', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', 'guide.md', '--outgoing']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('Incoming');
      expect(result.stdout).toContain('Outgoing');
      expect(result.stdout).not.toContain('README.md');
      expect(result.stdout).toContain('setup.md');
    });

    it('should show both when both flags are specified', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', 'guide.md', '--incoming', '--outgoing']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Incoming');
      expect(result.stdout).toContain('Outgoing');
    });
  });

  describe('Depth limiting', () => {
    it('should limit to depth 1 with --depth 1', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', 'README.md', '--depth', '1']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('guide.md');
      expect(result.stdout).toContain('api.md');
      // setup.md is depth 2, should not appear
      expect(result.stdout).not.toContain('setup.md');
    });

    it('should show no deps with --depth 0', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', 'README.md', '--depth', '0']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('None');
    });
  });

  describe('Output formats', () => {
    it('should output tree format by default', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', 'guide.md']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/[├└]/); // tree characters
    });

    it('should output list format with --format list', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', 'guide.md', '--format', 'list']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('- ');
      expect(result.stdout).toContain('Total:');
    });

    it('should output valid JSON with --format json', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', 'guide.md', '--format', 'json']);

      expect(result.exitCode).toBe(0);

      const parsed = JSON.parse(result.stdout);
      expect(parsed).toHaveProperty('file');
      expect(parsed).toHaveProperty('incoming');
      expect(parsed).toHaveProperty('outgoing');
      expect(parsed).toHaveProperty('stats');
    });
  });

  describe('Cycle detection', () => {
    it('should detect and report cycles', async () => {
      await setupCyclicFixture();

      const result = runCli(['deps', 'a.md']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('cycle detected');
    });

    it('should not infinite loop on cycles', async () => {
      await setupCyclicFixture();

      // If this completes in reasonable time, cycle detection is working
      const result = runCli(['deps', 'a.md']);

      expect(result.exitCode).toBe(0);
    });

    it('should show cycle information in JSON format', async () => {
      await setupCyclicFixture();

      const result = runCli(['deps', 'a.md', '--format', 'json']);

      const parsed = JSON.parse(result.stdout);
      expect(parsed.cycles).toBeInstanceOf(Array);
      expect(parsed.cycles.length).toBeGreaterThan(0);
      expect(parsed.stats.cyclesDetected).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should error when file does not exist in graph', async () => {
      await setupBasicFixture();
      await fs.writeFile(path.join(tempDir, 'orphan.md'), '# Orphan');

      const result = runCli(['deps', 'orphan.md']);

      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toContain('not found');
    });

    it('should error on invalid depth value', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', 'guide.md', '--depth', 'abc']);

      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toContain('Invalid depth');
    });

    it('should error on invalid format value', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', 'guide.md', '--format', 'invalid']);

      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toContain('format');
    });
  });

  describe('File path resolution', () => {
    it('should accept relative paths from cwd', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', './guide.md']);

      expect(result.exitCode).toBe(0);
    });

    it('should accept absolute paths', async () => {
      await setupBasicFixture();
      const absPath = path.join(tempDir, 'guide.md');

      const result = runCli(['deps', absPath]);

      expect(result.exitCode).toBe(0);
    });
  });

  describe('Global options', () => {
    it('should respect --no-colors flag', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', 'guide.md', '--no-colors']);

      expect(result.exitCode).toBe(0);
      // ANSI color codes should not be present
      expect(result.stdout).not.toMatch(/\x1b\[[0-9;]*m/);
    });

    it('should respect --verbose flag', async () => {
      await setupBasicFixture();

      const result = runCli(['deps', 'guide.md', '--verbose']);

      expect(result.exitCode).toBe(0);
      // Verbose output should include additional info
      expect(result.stdout).toContain('Building dependency graph');
    });
  });
});
