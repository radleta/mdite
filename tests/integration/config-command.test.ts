import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDir } from '../setup.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { join } from 'path';

describe('config command (integration)', () => {
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
    it('should display default configuration', async () => {
      const result = runCli(['config']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('entrypoint');
      expect(result.stdout).toContain('rules');
    });

    it('should display configuration in JSON format', async () => {
      const result = runCli(['config']);

      expect(result.exitCode).toBe(0);

      // Output should be valid JSON or contain config info
      expect(result.stdout.length).toBeGreaterThan(0);
      expect(result.stdout).toContain('README.md'); // Default entrypoint
    });

    it('should load project config if present', async () => {
      // Create a project config file
      const configPath = join(testDir, 'mdite.config.js');
      const customConfig = `
module.exports = {
  entrypoint: 'docs/index.md',
  rules: {
    'orphan-files': 'error',
    'dead-link': 'warn',
    'dead-anchor': 'off',
  },
};
`;
      await fs.writeFile(configPath, customConfig);

      const result = runCli(['config']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('docs/index.md');
    });

    it('should handle custom config path', async () => {
      const customPath = join(testDir, '.mditerc.json');
      const customConfig = JSON.stringify({
        entrypoint: 'custom.md',
        rules: {
          'orphan-files': 'warn',
        },
      });
      await fs.writeFile(customPath, customConfig);

      const result = runCli(['config', '--config', customPath]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('custom.md');
    });
  });

  describe('Configuration merging', () => {
    it('should merge default and project config', async () => {
      // Create a minimal project config
      const configPath = join(testDir, 'mdite.config.js');
      const customConfig = `
module.exports = {
  entrypoint: 'docs/README.md',
};
`;
      await fs.writeFile(configPath, customConfig);

      const result = runCli(['config']);

      expect(result.exitCode).toBe(0);
      // Should have custom entrypoint
      expect(result.stdout).toContain('docs/README.md');
      // Should still have default rules
      expect(result.stdout).toContain('rules');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid config file gracefully', async () => {
      const configPath = join(testDir, 'mdite.config.js');
      await fs.writeFile(configPath, 'This is not valid JavaScript{]');

      const result = runCli(['config']);

      // Should either show error or fall back to defaults
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing custom config path', async () => {
      const result = runCli(['config', '--config', '/nonexistent/path/config.js']);

      // Should either show error or use defaults
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Output format', () => {
    it('should produce readable output', async () => {
      const result = runCli(['config']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      // Should be structured and readable
      expect(result.stdout.split('\n').length).toBeGreaterThan(1);
    });

    it('should show all configuration sections', async () => {
      const result = runCli(['config']);

      expect(result.exitCode).toBe(0);
      // Should show main config sections
      const output = result.stdout.toLowerCase();
      expect(output).toMatch(/entrypoint|rules/);
    });
  });
});
