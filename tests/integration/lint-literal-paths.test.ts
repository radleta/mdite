import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDir, writeTestFile } from '../setup.js';
import { join } from 'path';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('lint command - literal path reporting (integration)', () => {
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
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.status || 0,
    };
  }

  describe('text format with literal inline display', () => {
    it('should show literal and resolved paths inline with "resolves to"', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Broken](./missing.md)');

      const result = runCli(['lint', '--format', 'text']);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('resolves to');
      expect(result.stdout).toContain('./missing.md');
    });

    it('should handle relative paths correctly', async () => {
      // Create deep directory structure
      await fs.mkdir(join(testDir, 'docs/deep/nested'), { recursive: true });
      await writeTestFile(
        join(testDir, 'docs/deep/nested/file.md'),
        '# File\n\n[Link](../../../missing.md)'
      );
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Link](./docs/deep/nested/file.md)'
      );

      const result = runCli(['lint', '--format', 'text']);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('../../../missing.md');
      expect(result.stdout).toContain('resolves to');
    });

    it('should handle anchor-only links with literal text', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Broken](#nonexistent-heading)');

      const result = runCli(['lint', '--format', 'text']);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('#nonexistent-heading');
    });
  });

  describe('JSON format with literal/resolvedPath/endColumn fields', () => {
    it('should include literal, resolvedPath, and endColumn in JSON output', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Broken](./missing.md)');

      const result = runCli(['lint', '--format', 'json']);

      expect(result.exitCode).toBe(1);
      const errors = JSON.parse(result.stdout);
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);

      const deadLinkError = errors.find((e: any) => e.rule === 'dead-link');
      expect(deadLinkError).toBeDefined();
      expect(deadLinkError.literal).toBe('./missing.md');
      expect(deadLinkError.endColumn).toBeDefined();
      expect(typeof deadLinkError.endColumn).toBe('number');
    });

    it('should have flat structure with all new fields', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Link](./broken.md)');

      const result = runCli(['lint', '--format', 'json']);

      const errors = JSON.parse(result.stdout);
      const error = errors.find((e: any) => e.rule === 'dead-link');

      // Verify flat structure (all fields at top level)
      expect(error).toHaveProperty('literal');
      expect(error).toHaveProperty('endColumn');
      expect(error).toHaveProperty('line');
      expect(error).toHaveProperty('column');
      expect(error).toHaveProperty('file');
      expect(error).toHaveProperty('severity');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('rule');
    });
  });

  describe('grep format tab-delimited output', () => {
    it('should output tab-delimited format with 8 fields', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Broken](./missing.md)');

      const result = runCli(['lint', '--format', 'grep']);

      expect(result.exitCode).toBe(1);
      const lines = result.stdout.trim().split('\n');
      expect(lines.length).toBeGreaterThan(0);

      // Check tab-delimited format
      const firstLine = lines.find((line: string) => line.includes('dead-link'));
      expect(firstLine).toBeDefined();
      const fields = firstLine!.split('\t');
      expect(fields.length).toBe(8);

      // Field order: file, line, column, endColumn, severity, ruleId, literal, resolvedPath
      expect(fields[0]).toContain('README.md'); // file
      expect(fields[1]).toMatch(/^\d+$/); // line number
      expect(fields[2]).toMatch(/^\d+$/); // column number
      expect(fields[3]).toMatch(/^\d*$/); // endColumn (may be empty)
      expect(['error', 'warning']).toContain(fields[4]); // severity
      expect(fields[5]).toBeTruthy(); // ruleId
      expect(fields[6]).toBeTruthy(); // literal
      expect(fields[7]).toBeTruthy(); // resolvedPath
    });

    it('should be parseable with cut command (field 7 = literal)', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Link1](./missing1.md)\n[Link2](./missing2.md)'
      );

      const result = runCli(['lint', '--format', 'grep']);

      expect(result.exitCode).toBe(1);
      const lines = result.stdout.trim().split('\n');

      // Extract field 7 (literal) from each line
      const literals = lines
        .filter((line: string) => line.trim())
        .map((line: string) => line.split('\t')[6]);

      expect(literals).toContain('./missing1.md');
      expect(literals).toContain('./missing2.md');
    });

    it('should handle empty fields gracefully', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\nOrphan file test');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      const result = runCli(['lint', '--format', 'grep']);

      expect(result.exitCode).toBe(1);
      const lines = result.stdout.trim().split('\n');
      const orphanLine = lines.find((line: string) => line.includes('orphan-files'));

      if (orphanLine) {
        const fields = orphanLine.split('\t');
        // Orphan files don't have literal/resolved paths, so fewer fields
        expect(fields.length).toBeGreaterThan(0);
        // But still has core fields: file, line, column, endColumn (empty), severity, ruleId
        expect(fields[0]).toContain('orphan.md'); // file
        expect(fields[4]).toBe('error'); // severity
        expect(fields[5]).toBe('orphan-files'); // ruleId
      }
    });
  });

  describe('backward compatibility', () => {
    it('should not crash when error has no literal field', async () => {
      // Create scenario where literal might be unavailable
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\nSimple test');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      // All three formats should work
      const textResult = runCli(['lint', '--format', 'text']);
      expect(textResult.exitCode).toBe(1);
      expect(textResult.stdout).toBeTruthy();

      const jsonResult = runCli(['lint', '--format', 'json']);
      expect(jsonResult.exitCode).toBe(1);
      const errors = JSON.parse(jsonResult.stdout);
      expect(Array.isArray(errors)).toBe(true);

      const grepResult = runCli(['lint', '--format', 'grep']);
      expect(grepResult.exitCode).toBe(1);
      expect(grepResult.stdout).toBeTruthy();
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple dead links in same file', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        `# Main

[Link1](./missing1.md)
[Link2](./missing2.md)
[Link3](./missing3.md)`
      );

      const result = runCli(['lint', '--format', 'json']);

      expect(result.exitCode).toBe(1);
      const errors = JSON.parse(result.stdout);
      const deadLinks = errors.filter((e: any) => e.rule === 'dead-link');
      expect(deadLinks.length).toBe(3);

      deadLinks.forEach((error: any) => {
        expect(error.literal).toBeDefined();
        expect(error.literal).toMatch(/\.\/missing\d\.md/);
        expect(error.endColumn).toBeGreaterThan(error.column);
      });
    });

    it('should handle dead link with dead anchor', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Link](./missing.md#anchor)');

      const result = runCli(['lint', '--format', 'json']);

      expect(result.exitCode).toBe(1);
      const errors = JSON.parse(result.stdout);
      const deadLinkError = errors.find((e: any) => e.rule === 'dead-link');

      expect(deadLinkError).toBeDefined();
      expect(deadLinkError.literal).toContain('./missing.md');
    });
  });
});
