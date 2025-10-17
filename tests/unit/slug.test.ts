import { describe, it, expect, beforeEach } from 'vitest';
import { slugify, clearSlugCache, getSlugCacheStats } from '../../src/utils/slug.js';

describe('slugify', () => {
  it('converts text to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('multiple   spaces')).toBe('multiple-spaces');
  });

  it('removes special characters', () => {
    expect(slugify('Hello! @#$ World?')).toBe('hello-world');
  });

  it('handles underscores', () => {
    expect(slugify('snake_case_text')).toBe('snake-case-text');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('---text---')).toBe('text');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('matches GitHub heading slugs', () => {
    expect(slugify('## Advanced Section')).toBe('advanced-section');
    expect(slugify('### Get Started!')).toBe('get-started');
  });
});

describe('slugify cache', () => {
  beforeEach(() => {
    clearSlugCache();
  });

  it('should cache results', () => {
    const slug1 = slugify('Hello World');
    const stats1 = getSlugCacheStats();
    expect(stats1.size).toBe(1);

    const slug2 = slugify('Hello World'); // Cache hit
    const stats2 = getSlugCacheStats();
    expect(stats2.size).toBe(1); // Still 1
    expect(slug2).toBe(slug1);
  });

  it('should handle different inputs', () => {
    slugify('Heading 1');
    slugify('Heading 2');
    slugify('Heading 1'); // Cache hit

    const stats = getSlugCacheStats();
    expect(stats.size).toBe(2); // Only 2 unique
  });

  it('should clear cache', () => {
    slugify('Test');
    expect(getSlugCacheStats().size).toBe(1);

    clearSlugCache();
    expect(getSlugCacheStats().size).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
    expect(getSlugCacheStats().size).toBe(2); // Both cached
  });

  it('should return cached value for repeated inputs', () => {
    const input = 'Installation';
    const firstResult = slugify(input);

    // Call multiple times
    for (let i = 0; i < 10; i++) {
      const result = slugify(input);
      expect(result).toBe(firstResult);
    }

    // Should still only have one entry
    const stats = getSlugCacheStats();
    expect(stats.size).toBe(1);
    expect(stats.entries).toEqual([['Installation', 'installation']]);
  });

  it('should handle multiple unique headings efficiently', () => {
    const headings = [
      'Installation',
      'Configuration',
      'Usage',
      'Examples',
      'API',
      'Installation', // Duplicate
      'Configuration', // Duplicate
    ];

    headings.forEach(heading => slugify(heading));

    const stats = getSlugCacheStats();
    expect(stats.size).toBe(5); // Only 5 unique headings
  });
});
