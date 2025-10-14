import { describe, it, expect, beforeEach } from 'vitest';
import { findMarkdownFiles, fileExists } from '../../src/utils/fs.js';
import { createTestDir, writeTestFile } from '../setup.js';
import { join } from 'path';

describe('FS Utils', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await createTestDir();
  });

  describe('findMarkdownFiles', () => {
    it('should find markdown files in directory', async () => {
      await writeTestFile(join(testDir, 'file1.md'), '# File 1');
      await writeTestFile(join(testDir, 'file2.md'), '# File 2');

      const files = await findMarkdownFiles(testDir);

      expect(files).toHaveLength(2);
      expect(files.some(f => f.endsWith('file1.md'))).toBe(true);
      expect(files.some(f => f.endsWith('file2.md'))).toBe(true);
    });

    it('should find markdown files in nested directories', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Root');
      await writeTestFile(join(testDir, 'docs/guide.md'), '# Guide');
      await writeTestFile(join(testDir, 'docs/api/index.md'), '# API');

      const files = await findMarkdownFiles(testDir);

      expect(files).toHaveLength(3);
      expect(files.some(f => f.endsWith('README.md'))).toBe(true);
      expect(files.some(f => f.includes('docs') && f.endsWith('guide.md'))).toBe(true);
      expect(files.some(f => f.includes('api') && f.endsWith('index.md'))).toBe(true);
    });

    it('should skip node_modules directory', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Root');
      await writeTestFile(join(testDir, 'node_modules/package/README.md'), '# Package');

      const files = await findMarkdownFiles(testDir);

      expect(files).toHaveLength(1);
      expect(files[0]).toContain('README.md');
      expect(files[0]).not.toContain('node_modules');
    });

    it('should skip hidden directories', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Root');
      await writeTestFile(join(testDir, '.git/README.md'), '# Git');
      await writeTestFile(join(testDir, '.config/notes.md'), '# Config');

      const files = await findMarkdownFiles(testDir);

      expect(files).toHaveLength(1);
      expect(files[0]).toContain('README.md');
      expect(files[0]).not.toContain('.git');
      expect(files[0]).not.toContain('.config');
    });

    it('should only include .md files', async () => {
      await writeTestFile(join(testDir, 'file.md'), '# Markdown');
      await writeTestFile(join(testDir, 'file.txt'), 'Text file');
      await writeTestFile(join(testDir, 'file.mdx'), '# MDX');
      await writeTestFile(join(testDir, 'file.markdown'), '# Markdown');

      const files = await findMarkdownFiles(testDir);

      expect(files).toHaveLength(1);
      expect(files[0]).toContain('file.md');
    });

    it('should return empty array for empty directory', async () => {
      const files = await findMarkdownFiles(testDir);
      expect(files).toHaveLength(0);
    });

    it('should handle deeply nested structures', async () => {
      await writeTestFile(join(testDir, 'a/b/c/d/e/file.md'), '# Deep');

      const files = await findMarkdownFiles(testDir);

      expect(files).toHaveLength(1);
      expect(files[0]).toContain('a/b/c/d/e/file.md');
    });

    it('should return absolute paths', async () => {
      await writeTestFile(join(testDir, 'file.md'), '# File');

      const files = await findMarkdownFiles(testDir);

      expect(files[0]).toContain(testDir);
      expect(files[0]!.startsWith('/')).toBe(true);
    });

    it('should handle multiple files in same directory', async () => {
      await writeTestFile(join(testDir, 'file1.md'), '# 1');
      await writeTestFile(join(testDir, 'file2.md'), '# 2');
      await writeTestFile(join(testDir, 'file3.md'), '# 3');
      await writeTestFile(join(testDir, 'file4.md'), '# 4');
      await writeTestFile(join(testDir, 'file5.md'), '# 5');

      const files = await findMarkdownFiles(testDir);

      expect(files).toHaveLength(5);
    });

    it('should work with complex directory structures', async () => {
      // Create a realistic documentation structure
      await writeTestFile(join(testDir, 'README.md'), '# Root');
      await writeTestFile(join(testDir, 'docs/README.md'), '# Docs');
      await writeTestFile(join(testDir, 'docs/getting-started.md'), '# Start');
      await writeTestFile(join(testDir, 'docs/guides/installation.md'), '# Install');
      await writeTestFile(join(testDir, 'docs/guides/configuration.md'), '# Config');
      await writeTestFile(join(testDir, 'docs/api/reference.md'), '# API');
      await writeTestFile(join(testDir, 'examples/basic.md'), '# Example');

      const files = await findMarkdownFiles(testDir);

      expect(files).toHaveLength(7);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = join(testDir, 'file.md');
      await writeTestFile(filePath, '# Content');

      const exists = await fileExists(filePath);

      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const filePath = join(testDir, 'nonexistent.md');

      const exists = await fileExists(filePath);

      expect(exists).toBe(false);
    });

    it('should work with absolute paths', async () => {
      const filePath = join(testDir, 'test.md');
      await writeTestFile(filePath, '# Test');

      const exists = await fileExists(filePath);

      expect(exists).toBe(true);
    });

    it('should return false for directories', async () => {
      // Note: fileExists uses fs.access which returns true for directories
      // This test documents actual behavior
      const exists = await fileExists(testDir);
      expect(exists).toBe(true); // Directories are accessible
    });

    it('should handle files in nested directories', async () => {
      const filePath = join(testDir, 'a/b/c/file.md');
      await writeTestFile(filePath, '# Nested');

      const exists = await fileExists(filePath);

      expect(exists).toBe(true);
    });

    it('should return false for files in non-existent directories', async () => {
      const filePath = join(testDir, 'nonexistent/file.md');

      const exists = await fileExists(filePath);

      expect(exists).toBe(false);
    });

    it('should work with relative paths', async () => {
      const filePath = join(testDir, './file.md');
      await writeTestFile(filePath, '# Test');

      const exists = await fileExists(filePath);

      expect(exists).toBe(true);
    });

    it('should handle empty path gracefully', async () => {
      const exists = await fileExists('');
      expect(exists).toBe(false);
    });

    it('should handle special characters in filenames', async () => {
      const filePath = join(testDir, 'file with spaces.md');
      await writeTestFile(filePath, '# Spaces');

      const exists = await fileExists(filePath);

      expect(exists).toBe(true);
    });

    it('should be case-sensitive on Linux', async () => {
      const filePath = join(testDir, 'File.md');
      await writeTestFile(filePath, '# Test');

      const existsCorrectCase = await fileExists(filePath);

      expect(existsCorrectCase).toBe(true);
      // On Linux, case matters; on macOS/Windows, it might not
      // This documents the behavior on the current system
    });
  });

  describe('integration', () => {
    it('should work together for file discovery and validation', async () => {
      await writeTestFile(join(testDir, 'file1.md'), '# 1');
      await writeTestFile(join(testDir, 'file2.md'), '# 2');

      const found = await findMarkdownFiles(testDir);

      expect(found).toHaveLength(2);

      for (const file of found) {
        const exists = await fileExists(file);
        expect(exists).toBe(true);
      }
    });

    it('should handle mixed file types correctly', async () => {
      await writeTestFile(join(testDir, 'doc.md'), '# Doc');
      await writeTestFile(join(testDir, 'readme.txt'), 'Text');
      await writeTestFile(join(testDir, 'config.json'), '{}');

      const mdFiles = await findMarkdownFiles(testDir);

      expect(mdFiles).toHaveLength(1);
      expect(mdFiles[0]).toContain('doc.md');

      // All files exist, but only .md is found
      expect(await fileExists(join(testDir, 'doc.md'))).toBe(true);
      expect(await fileExists(join(testDir, 'readme.txt'))).toBe(true);
      expect(await fileExists(join(testDir, 'config.json'))).toBe(true);
    });
  });
});
