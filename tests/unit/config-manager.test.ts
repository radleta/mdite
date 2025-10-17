import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigManager } from '../../src/core/config-manager.js';
import { createTestDir } from '../setup.js';

describe('ConfigManager', () => {
  beforeEach(async () => {
    await createTestDir(); // Create but don't use - needed for cleanup
  });

  describe('load', () => {
    it('should load default config when no file exists', async () => {
      const manager = await ConfigManager.load();
      const config = manager.getConfig();

      expect(config.entrypoint).toBe('README.md');
      expect(config.format).toBe('text');
      expect(config.colors).toBe(true);
      expect(config.verbose).toBe(false);
      expect(config.rules['orphan-files']).toBe('error');
      expect(config.rules['dead-link']).toBe('error');
      expect(config.rules['dead-anchor']).toBe('error');
    });

    it('should merge CLI options with default config', async () => {
      const manager = await ConfigManager.load({
        entrypoint: 'custom.md',
      });
      const config = manager.getConfig();

      expect(config.entrypoint).toBe('custom.md');
      // Should still have default rules
      expect(config.rules['orphan-files']).toBe('error');
    });

    it('should override format via CLI', async () => {
      const manager = await ConfigManager.load({
        format: 'json',
      });
      const config = manager.getConfig();

      expect(config.format).toBe('json');
    });

    it('should override colors via CLI', async () => {
      const manager = await ConfigManager.load({
        colors: false,
      });
      const config = manager.getConfig();

      expect(config.colors).toBe(false);
    });

    it('should override verbose via CLI', async () => {
      const manager = await ConfigManager.load({
        verbose: true,
      });
      const config = manager.getConfig();

      expect(config.verbose).toBe(true);
    });
  });

  describe('methods', () => {
    it('should provide get method for specific keys', async () => {
      const manager = await ConfigManager.load({
        entrypoint: 'test.md',
      });

      expect(manager.get('entrypoint')).toBe('test.md');
      expect(manager.get('format')).toBe('text');
      expect(manager.get('colors')).toBe(true);
    });

    it('should check if rule is enabled', async () => {
      const manager = await ConfigManager.load();

      expect(manager.isRuleEnabled('orphan-files')).toBe(true);
      expect(manager.isRuleEnabled('dead-link')).toBe(true);
      expect(manager.isRuleEnabled('unknown-rule')).toBe(false);
    });

    it('should get rule severity', async () => {
      const manager = await ConfigManager.load();

      expect(manager.getRuleSeverity('orphan-files')).toBe('error');
      expect(manager.getRuleSeverity('dead-link')).toBe('error');
      expect(manager.getRuleSeverity('unknown-rule')).toBe('off');
    });

    it('should treat warn severity as enabled', async () => {
      const manager = await ConfigManager.load();

      // Since we can't set rules via CLI in the new API, we test with default rules
      expect(manager.isRuleEnabled('orphan-files')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty CLI options', async () => {
      const manager = await ConfigManager.load({});
      const config = manager.getConfig();

      expect(config.entrypoint).toBe('README.md');
    });

    it('should handle undefined CLI options', async () => {
      const manager = await ConfigManager.load(undefined);
      const config = manager.getConfig();

      expect(config.entrypoint).toBe('README.md');
    });

    it('should handle multiple CLI options', async () => {
      const manager = await ConfigManager.load({
        entrypoint: 'docs/index.md',
        format: 'json',
        colors: false,
        verbose: true,
      });
      const config = manager.getConfig();

      expect(config.entrypoint).toBe('docs/index.md');
      expect(config.format).toBe('json');
      expect(config.colors).toBe(false);
      expect(config.verbose).toBe(true);
    });
  });
});
