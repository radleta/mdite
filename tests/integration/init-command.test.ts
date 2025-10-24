import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDir } from '../setup.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { join } from 'path';

describe('init command (integration)', () => {
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

  describe('Basic functionality', () => {
    it('should create a default config file', async () => {
      const result = runCli(['init']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('Created');

      // Check that the config file was created
      const configPath = join(testDir, 'mdite.config.js');
      const configExists = await fs
        .access(configPath)
        .then(() => true)
        .catch(() => false);
      expect(configExists).toBe(true);

      // Verify config file content is valid
      const configContent = await fs.readFile(configPath, 'utf-8');
      expect(configContent).toContain('module.exports');
      expect(configContent).toContain('entrypoint');
      expect(configContent).toContain('rules');
    });

    it('should not overwrite existing config file by default', async () => {
      // Create an existing config
      const configPath = join(testDir, 'mdite.config.js');
      await fs.writeFile(configPath, '// Existing config\nmodule.exports = {};');

      const result = runCli(['init']);

      expect(result.exitCode).toBe(2); // USAGE_ERROR
      expect(result.stderr).toContain('already exists');

      // Verify original content is preserved
      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toContain('// Existing config');
    });

    it('should support custom config path', async () => {
      const customPath = 'custom.config.js';
      const configPath = join(testDir, customPath);

      // Pre-condition: File should NOT exist
      const existsBefore = await fs
        .access(configPath)
        .then(() => true)
        .catch(() => false);
      expect(existsBefore).toBe(false);

      // Run command
      const result = runCli(['init', '--config', customPath]);

      // Assert exact behavior
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('Created');
      expect(result.stderr).toContain(customPath);

      // Verify file was created at custom path
      const existsAfter = await fs
        .access(configPath)
        .then(() => true)
        .catch(() => false);
      expect(existsAfter).toBe(true);

      // Verify content
      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toContain('module.exports');
      expect(content).toContain('entrypoint');
      expect(content).toContain('rules');
    });
  });

  describe('Error handling', () => {
    it('should handle write errors gracefully', async () => {
      // Try to write to a path where parent directory doesn't exist
      // fs.writeFile will fail with ENOENT (cross-platform behavior)
      const result = runCli(['init', '--config', 'nonexistent/deeply/nested/path/config.js']);

      // Should fail with ERROR (code 1) because parent dirs don't exist
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Failed to create configuration');
    });

    it('should handle invalid config paths', async () => {
      // Try to create config in a non-existent directory
      // fs.writeFile does NOT create parent directories (unlike mkdir -p)
      const result = runCli(['init', '--config', 'nonexistent/subdir/config.js']);

      // Should fail with ERROR (code 1) because parent directory doesn't exist
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Failed to create configuration');
    });
  });

  describe('Config file format', () => {
    it('should create a valid JavaScript config', async () => {
      const result = runCli(['init']);

      expect(result.exitCode).toBe(0);

      const configPath = join(testDir, 'mdite.config.js');
      const configContent = await fs.readFile(configPath, 'utf-8');

      // Verify structure
      expect(configContent).toContain('entrypoint:');
      expect(configContent).toContain('rules:');
      expect(configContent).toContain('orphan-files');
      expect(configContent).toContain('dead-link');
      expect(configContent).toContain('dead-anchor');
    });
  });
});
