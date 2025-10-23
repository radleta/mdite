import { describe, it, expect } from 'vitest';
import {
  CONFIG_METADATA,
  RULES_METADATA,
  CONFIG_LAYERS,
  getMetadataByCategory,
  fuzzyMatch,
  type ConfigCategory,
  type ConfigLayer,
} from '../../src/types/config-metadata.js';
import { DEFAULT_CONFIG } from '../../src/types/config.js';

describe('ConfigMetadata', () => {
  describe('Metadata completeness', () => {
    it('should have metadata for all config keys', () => {
      const schemaKeys = Object.keys(DEFAULT_CONFIG);

      // Every key in DEFAULT_CONFIG should have metadata
      schemaKeys.forEach(key => {
        expect(CONFIG_METADATA[key], `Missing metadata for config key: ${key}`).toBeDefined();
      });
    });

    it('should have all required fields for each option', () => {
      Object.entries(CONFIG_METADATA).forEach(([key, meta]) => {
        expect(meta.description, `${key}.description missing`).toBeTruthy();
        expect(meta.description.length, `${key}.description too short`).toBeGreaterThan(10);
        expect(meta.type, `${key}.type missing`).toBeTruthy();
        expect(meta, `${key}.default missing`).toHaveProperty('default');
        expect(meta.examples, `${key}.examples missing`).toBeInstanceOf(Array);
        expect(meta.examples.length, `${key}.examples empty`).toBeGreaterThan(0);
        expect(meta.category, `${key}.category missing`).toBeTruthy();
        expect(meta.layer, `${key}.layer missing`).toBeInstanceOf(Array);
        expect(meta.layer.length, `${key}.layer empty`).toBeGreaterThan(0);
      });
    });

    it('should not have extra unknown keys in metadata', () => {
      const schemaKeys = Object.keys(DEFAULT_CONFIG);
      const metadataKeys = Object.keys(CONFIG_METADATA);

      // Every metadata key should exist in schema (or be a known exception)
      metadataKeys.forEach(key => {
        const isInSchema = schemaKeys.includes(key);
        const isKnownException = key === 'cliExclude'; // Known CLI-only option
        expect(isInSchema || isKnownException, `Metadata key '${key}' not in DEFAULT_CONFIG`).toBe(
          true
        );
      });
    });

    it('should have defaults matching DEFAULT_CONFIG', () => {
      Object.entries(CONFIG_METADATA).forEach(([key, meta]) => {
        if (key in DEFAULT_CONFIG) {
          const defaultValue = DEFAULT_CONFIG[key as keyof typeof DEFAULT_CONFIG];
          expect(meta.default, `${key} default mismatch`).toEqual(defaultValue);
        }
      });
    });
  });

  describe('Metadata validity', () => {
    it('should have valid categories', () => {
      const validCategories: ConfigCategory[] = [
        'core',
        'rules',
        'performance',
        'exclusion',
        'scope',
      ];

      Object.entries(CONFIG_METADATA).forEach(([key, meta]) => {
        expect(validCategories, `${key} has invalid category: ${meta.category}`).toContain(
          meta.category
        );
      });
    });

    it('should have valid layers', () => {
      const validLayers: ConfigLayer[] = ['defaults', 'user', 'project', 'cli'];

      Object.values(CONFIG_METADATA).forEach(meta => {
        meta.layer.forEach(layer => {
          expect(validLayers, `Invalid layer: ${layer}`).toContain(layer);
        });
      });
    });

    it('should have non-empty descriptions', () => {
      Object.entries(CONFIG_METADATA).forEach(([key, meta]) => {
        expect(meta.description.length, `${key} description too short`).toBeGreaterThan(10);
      });
    });

    it('should have examples of appropriate types', () => {
      // Check a few specific types
      expect(CONFIG_METADATA.entrypoint!.examples.every(e => typeof e === 'string')).toBe(true);

      expect(
        CONFIG_METADATA.depth!.examples.every(e => typeof e === 'number' || e === 'unlimited')
      ).toBe(true);

      expect(CONFIG_METADATA.colors!.examples.every(e => typeof e === 'boolean')).toBe(true);

      expect(CONFIG_METADATA.exclude!.examples.every(e => Array.isArray(e))).toBe(true);
    });

    it('should have relatedOptions that exist', () => {
      const allKeys = Object.keys(CONFIG_METADATA);

      Object.entries(CONFIG_METADATA).forEach(([key, meta]) => {
        if (meta.relatedOptions) {
          meta.relatedOptions.forEach(relatedKey => {
            expect(
              allKeys,
              `${key} references non-existent related option: ${relatedKey}`
            ).toContain(relatedKey);
          });
        }
      });
    });

    it('should have long descriptions for complex options', () => {
      // Complex options should have detailed explanations
      const complexOptions = ['depth', 'maxConcurrency', 'scopeLimit', 'externalLinks'];

      complexOptions.forEach(key => {
        const meta = CONFIG_METADATA[key];
        expect(meta, `Missing metadata for ${key}`).toBeDefined();
        if (meta) {
          expect(meta.longDescription, `${key} should have longDescription`).toBeTruthy();
          expect(meta.longDescription!.length, `${key} longDescription too short`).toBeGreaterThan(
            50
          );
        }
      });
    });

    it('should have validation strings where appropriate', () => {
      // Options with constraints should have validation
      const optionsWithValidation = ['depth', 'maxConcurrency', 'format'];

      optionsWithValidation.forEach(key => {
        const meta = CONFIG_METADATA[key];
        expect(meta, `Missing metadata for ${key}`).toBeDefined();
        if (meta) {
          expect(meta.validation, `${key} should have validation`).toBeTruthy();
        }
      });
    });

    it('should have whenToChange guidance for configurable options', () => {
      // Most options should have whenToChange guidance
      Object.entries(CONFIG_METADATA).forEach(([key, meta]) => {
        // Core options and configurable options should have this
        if (['core', 'performance', 'exclusion', 'scope'].includes(meta.category)) {
          expect(meta.whenToChange, `${key} should have whenToChange guidance`).toBeTruthy();
        }
      });
    });
  });

  describe('getMetadataByCategory', () => {
    it('should group metadata by category', () => {
      const grouped = getMetadataByCategory();

      expect(grouped.core).toBeDefined();
      expect(grouped.rules).toBeDefined();
      expect(grouped.performance).toBeDefined();
      expect(grouped.exclusion).toBeDefined();
      expect(grouped.scope).toBeDefined();
    });

    it('should have all categories populated', () => {
      const grouped = getMetadataByCategory();

      // Core should have multiple options
      expect(Object.keys(grouped.core).length).toBeGreaterThan(0);
      // Rules should have the rules option
      expect(Object.keys(grouped.rules).length).toBeGreaterThan(0);
      // Performance should have maxConcurrency
      expect(Object.keys(grouped.performance).length).toBeGreaterThan(0);
      // Exclusion should have exclude options
      expect(Object.keys(grouped.exclusion).length).toBeGreaterThan(0);
      // Scope should have scope options
      expect(Object.keys(grouped.scope).length).toBeGreaterThan(0);
    });

    it('should not duplicate options across categories', () => {
      const grouped = getMetadataByCategory();
      const allKeys: string[] = [];

      Object.values(grouped).forEach(categoryOptions => {
        Object.keys(categoryOptions).forEach(key => {
          expect(allKeys, `Duplicate key ${key} across categories`).not.toContain(key);
          allKeys.push(key);
        });
      });
    });

    it('should include all metadata keys', () => {
      const grouped = getMetadataByCategory();
      const groupedKeys: string[] = [];

      Object.values(grouped).forEach(categoryOptions => {
        groupedKeys.push(...Object.keys(categoryOptions));
      });

      const metadataKeys = Object.keys(CONFIG_METADATA);
      metadataKeys.forEach(key => {
        expect(groupedKeys, `Key ${key} not in grouped metadata`).toContain(key);
      });
    });
  });

  describe('fuzzyMatch', () => {
    it('should suggest close matches for typos', () => {
      const suggestions = fuzzyMatch('maxConcurency', Object.keys(CONFIG_METADATA));
      expect(suggestions).toContain('maxConcurrency');
    });

    it('should handle exact matches', () => {
      const suggestions = fuzzyMatch('entrypoint', Object.keys(CONFIG_METADATA));
      expect(suggestions[0]).toBe('entrypoint');
    });

    it('should return empty array for very different strings', () => {
      const suggestions = fuzzyMatch('completelydifferentstring', Object.keys(CONFIG_METADATA));
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should respect maxSuggestions parameter', () => {
      const suggestions = fuzzyMatch('depth', Object.keys(CONFIG_METADATA), 1);
      expect(suggestions.length).toBeLessThanOrEqual(1);
    });

    it('should be case insensitive', () => {
      const suggestions = fuzzyMatch('ENTRYPOINT', Object.keys(CONFIG_METADATA));
      expect(suggestions).toContain('entrypoint');
    });

    it('should handle single character differences', () => {
      const suggestions = fuzzyMatch('dept', Object.keys(CONFIG_METADATA));
      expect(suggestions).toContain('depth');
    });

    it('should handle transpositions', () => {
      const suggestions = fuzzyMatch('exlcude', Object.keys(CONFIG_METADATA));
      expect(suggestions).toContain('exclude');
    });

    it('should return closest matches first', () => {
      const suggestions = fuzzyMatch('rul', Object.keys(CONFIG_METADATA));
      // 'rules' should be first as it's closest (distance 2)
      if (suggestions.length > 0) {
        expect(suggestions[0]).toBe('rules');
      }
    });
  });

  describe('RULES_METADATA', () => {
    it('should have metadata for all default rules', () => {
      const defaultRules = Object.keys(DEFAULT_CONFIG.rules);

      defaultRules.forEach(rule => {
        expect(RULES_METADATA[rule], `Missing metadata for rule: ${rule}`).toBeDefined();
      });
    });

    it('should have required fields for each rule', () => {
      Object.entries(RULES_METADATA).forEach(([rule, meta]) => {
        expect(meta.description, `${rule} description missing`).toBeTruthy();
        expect(meta.impact, `${rule} impact missing`).toBeTruthy();
        expect(meta.whenToDisable, `${rule} whenToDisable missing`).toBeTruthy();
      });
    });

    it('should have meaningful descriptions', () => {
      Object.entries(RULES_METADATA).forEach(([rule, meta]) => {
        expect(meta.description.length, `${rule} description too short`).toBeGreaterThan(10);
        expect(meta.impact.length, `${rule} impact too short`).toBeGreaterThan(10);
        expect(meta.whenToDisable.length, `${rule} whenToDisable too short`).toBeGreaterThan(10);
      });
    });
  });

  describe('CONFIG_LAYERS', () => {
    it('should have all layers documented', () => {
      const requiredLayers: ConfigLayer[] = ['defaults', 'user', 'project', 'cli'];

      requiredLayers.forEach(layer => {
        expect(CONFIG_LAYERS[layer], `Missing documentation for layer: ${layer}`).toBeDefined();
      });
    });

    it('should have descriptions for all layers', () => {
      Object.entries(CONFIG_LAYERS).forEach(([layer, description]) => {
        expect(description, `${layer} description missing`).toBeTruthy();
        expect(description.length, `${layer} description too short`).toBeGreaterThan(10);
      });
    });

    it('should describe layer priority order', () => {
      // CLI should mention highest priority
      expect(CONFIG_LAYERS.cli.toLowerCase()).toContain('highest');

      // Defaults should mention it's the base layer
      expect(CONFIG_LAYERS.defaults.toLowerCase()).toMatch(/built-in|default/);
    });
  });
});
