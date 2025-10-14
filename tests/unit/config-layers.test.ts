import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../../src/core/config-manager.js';
import { writeTestConfig, createTestDir } from '../setup.js';
import * as fs from 'fs';
import * as path from 'path';

describe('ConfigManager - Layered Configuration', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = await createTestDir();
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  describe('configuration layers', () => {
    it('should use default config when no other configs exist', async () => {
      const manager = await ConfigManager.load();
      const config = manager.getConfig();

      expect(config.entrypoint).toBe('README.md');
      expect(config.format).toBe('text');
      expect(config.colors).toBe(true);
      expect(config.verbose).toBe(false);
      expect(config.rules['orphan-files']).toBe('error');
    });

    it('should merge project config over defaults', async () => {
      await writeTestConfig(path.join(testDir, '.doclintrc'), {
        entrypoint: 'docs/index.md',
        rules: {
          'orphan-files': 'warn',
        },
      });

      const manager = await ConfigManager.load();
      const config = manager.getConfig();

      expect(config.entrypoint).toBe('docs/index.md');
      expect(config.rules['orphan-files']).toBe('warn');
      // Should keep other defaults
      expect(config.rules['dead-link']).toBe('error');
    });

    it('should merge CLI options over project config', async () => {
      await writeTestConfig(path.join(testDir, '.doclintrc'), {
        entrypoint: 'docs/index.md',
      });

      const manager = await ConfigManager.load({
        entrypoint: 'cli-override.md',
        format: 'json',
      });
      const config = manager.getConfig();

      // CLI should win
      expect(config.entrypoint).toBe('cli-override.md');
      expect(config.format).toBe('json');
    });

    it('should support explicit config file path', async () => {
      const customConfigPath = path.join(testDir, 'custom-config.json');
      fs.writeFileSync(
        customConfigPath,
        JSON.stringify({
          entrypoint: 'custom-entry.md',
        })
      );

      const manager = await ConfigManager.load({
        config: customConfigPath,
      });
      const config = manager.getConfig();

      expect(config.entrypoint).toBe('custom-entry.md');
    });
  });

  describe('CLI options priority', () => {
    it('should allow CLI to override entrypoint', async () => {
      const manager = await ConfigManager.load({
        entrypoint: 'cli-entry.md',
      });
      const config = manager.getConfig();

      expect(config.entrypoint).toBe('cli-entry.md');
    });

    it('should allow CLI to override format', async () => {
      const manager = await ConfigManager.load({
        format: 'json',
      });
      const config = manager.getConfig();

      expect(config.format).toBe('json');
    });

    it('should allow CLI to override colors', async () => {
      const manager = await ConfigManager.load({
        colors: false,
      });
      const config = manager.getConfig();

      expect(config.colors).toBe(false);
    });

    it('should allow CLI to override verbose', async () => {
      const manager = await ConfigManager.load({
        verbose: true,
      });
      const config = manager.getConfig();

      expect(config.verbose).toBe(true);
    });
  });

  describe('config methods', () => {
    it('should provide getConfig() to get full config', async () => {
      const manager = await ConfigManager.load();
      const config = manager.getConfig();

      expect(config).toHaveProperty('entrypoint');
      expect(config).toHaveProperty('format');
      expect(config).toHaveProperty('colors');
      expect(config).toHaveProperty('verbose');
      expect(config).toHaveProperty('rules');
    });

    it('should provide get() for specific config keys', async () => {
      const manager = await ConfigManager.load({
        entrypoint: 'test.md',
      });

      expect(manager.get('entrypoint')).toBe('test.md');
      expect(manager.get('format')).toBe('text');
      expect(manager.get('colors')).toBe(true);
    });

    it('should check if rules are enabled', async () => {
      const manager = await ConfigManager.load();

      expect(manager.isRuleEnabled('orphan-files')).toBe(true);
      expect(manager.isRuleEnabled('dead-link')).toBe(true);
      expect(manager.isRuleEnabled('non-existent')).toBe(false);
    });

    it('should get rule severity', async () => {
      const manager = await ConfigManager.load();

      expect(manager.getRuleSeverity('orphan-files')).toBe('error');
      expect(manager.getRuleSeverity('dead-link')).toBe('error');
      expect(manager.getRuleSeverity('non-existent')).toBe('off');
    });
  });

  describe('project config formats', () => {
    it('should load .doclintrc JSON config', async () => {
      await writeTestConfig(path.join(testDir, '.doclintrc'), {
        entrypoint: 'from-doclintrc.md',
      });

      const manager = await ConfigManager.load();
      const config = manager.getConfig();

      expect(config.entrypoint).toBe('from-doclintrc.md');
    });

    it('should load .doclintrc.json config', async () => {
      await writeTestConfig(path.join(testDir, '.doclintrc.json'), {
        entrypoint: 'from-doclintrc-json.md',
      });

      const manager = await ConfigManager.load();
      const config = manager.getConfig();

      expect(config.entrypoint).toBe('from-doclintrc-json.md');
    });

    it('should support package.json doclint field', async () => {
      const packageJson = {
        name: 'test-project',
        doclint: {
          entrypoint: 'from-package-json.md',
        },
      };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      const manager = await ConfigManager.load();
      const config = manager.getConfig();

      expect(config.entrypoint).toBe('from-package-json.md');
    });
  });

  describe('rule merging', () => {
    it('should merge project rules with default rules', async () => {
      await writeTestConfig(path.join(testDir, '.doclintrc'), {
        rules: {
          'orphan-files': 'warn',
        },
      });

      const manager = await ConfigManager.load();
      const config = manager.getConfig();

      expect(config.rules['orphan-files']).toBe('warn');
      // Should keep other defaults
      expect(config.rules['dead-link']).toBe('error');
      expect(config.rules['dead-anchor']).toBe('error');
    });

    it('should support adding new rules', async () => {
      await writeTestConfig(path.join(testDir, '.doclintrc'), {
        rules: {
          'custom-rule': 'error',
        },
      });

      const manager = await ConfigManager.load();
      const config = manager.getConfig();

      expect(config.rules['custom-rule']).toBe('error');
      // Should keep defaults
      expect(config.rules['orphan-files']).toBe('error');
    });
  });

  describe('error handling', () => {
    it('should throw on invalid project config', async () => {
      await writeTestConfig(path.join(testDir, '.doclintrc'), {
        rules: {
          'test-rule': 'invalid-severity', // Invalid severity
        },
      });

      await expect(ConfigManager.load()).rejects.toThrow();
    });

    // Note: cosmiconfig handles malformed JSON gracefully by skipping the file
    // This is expected behavior, so we don't test for it throwing
  });

  describe('frontmatterSchema support', () => {
    it('should pass through frontmatterSchema from project config', async () => {
      const schema = {
        type: 'object',
        properties: {
          title: { type: 'string' },
          author: { type: 'string' },
        },
      };

      await writeTestConfig(path.join(testDir, '.doclintrc'), {
        frontmatterSchema: schema,
      });

      const manager = await ConfigManager.load();
      const config = manager.getConfig();

      expect(config.frontmatterSchema).toEqual(schema);
    });
  });
});
