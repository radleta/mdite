import { describe, it, expect } from 'vitest';
import {
  getUserConfigDir,
  getUserConfigPath,
  getProjectConfigPath,
  resolveTilde,
} from '../../src/utils/paths.js';
import { homedir } from 'os';
import { join, resolve } from 'path';

describe('Path Utilities', () => {
  describe('getUserConfigDir', () => {
    it('should return user config directory path', () => {
      const result = getUserConfigDir();
      const expected = join(homedir(), '.config', 'doc-lint');

      expect(result).toBe(expected);
    });

    it('should return absolute path', () => {
      const result = getUserConfigDir();

      expect(result).toMatch(/^[/\\]|^[a-zA-Z]:[/\\]/); // Unix or Windows absolute path
    });
  });

  describe('getUserConfigPath', () => {
    it('should return user config file path', () => {
      const result = getUserConfigPath();
      const expected = join(homedir(), '.config', 'doc-lint', 'config.json');

      expect(result).toBe(expected);
    });

    it('should end with config.json', () => {
      const result = getUserConfigPath();

      expect(result).toMatch(/config\.json$/);
    });
  });

  describe('getProjectConfigPath', () => {
    it('should return project config path in current directory', () => {
      const result = getProjectConfigPath();
      const expected = resolve(process.cwd(), '.doclintrc');

      expect(result).toBe(expected);
    });

    it('should return absolute path', () => {
      const result = getProjectConfigPath();

      expect(result).toMatch(/^[/\\]|^[a-zA-Z]:[/\\]/); // Unix or Windows absolute path
    });
  });

  describe('resolveTilde', () => {
    it('should expand tilde at start of path', () => {
      const result = resolveTilde('~/documents/file.txt');
      const expected = join(homedir(), 'documents', 'file.txt');

      expect(result).toBe(expected);
    });

    it('should not modify paths without tilde', () => {
      const path = '/absolute/path/file.txt';
      const result = resolveTilde(path);

      expect(result).toBe(path);
    });

    it('should not modify relative paths without tilde', () => {
      const path = './relative/path/file.txt';
      const result = resolveTilde(path);

      expect(result).toBe(path);
    });

    it('should handle tilde in middle of path (no expansion)', () => {
      const path = '/path/to/~/file.txt';
      const result = resolveTilde(path);

      // Tilde not at start, should not be expanded
      expect(result).toBe(path);
    });

    it('should handle empty tilde path', () => {
      const result = resolveTilde('~');

      expect(result).toBe('~');
    });

    it('should expand tilde with forward slash', () => {
      const result = resolveTilde('~/');
      const expected = join(homedir(), '');

      expect(result).toBe(expected);
    });
  });
});
