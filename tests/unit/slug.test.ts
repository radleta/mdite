import { describe, it, expect } from 'vitest';
import { slugify } from '../../src/utils/slug.js';

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
