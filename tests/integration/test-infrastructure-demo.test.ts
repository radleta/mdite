import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { readFile } from 'fs/promises';
import {
  createTestDir,
  writeTestFile,
  writeTestMarkdown,
  writeTestConfig,
  createTestDocs,
  ConsoleCapture,
  getTestDir,
} from '../setup.js';
import { getFixturePath, loadFixture, assertArrayContains, delay, createSpy } from '../utils.js';
import { MockLogger } from '../mocks/logger.mock.js';

describe('test infrastructure demonstration', () => {
  describe('setup utilities', () => {
    it('should create test directories and files', async () => {
      const testDir = await createTestDir();
      const testFile = join(testDir, 'test.txt');

      await writeTestFile(testFile, 'Hello, World!');

      const content = await readFile(testFile, 'utf-8');
      expect(content).toBe('Hello, World!');
    });

    it('should get the most recent test directory', async () => {
      await createTestDir(); // First directory
      const testDir2 = await createTestDir();

      expect(getTestDir()).toBe(testDir2);
    });

    it('should create markdown files with frontmatter', async () => {
      const testDir = await createTestDir();
      const mdFile = join(testDir, 'test.md');

      await writeTestMarkdown(mdFile, {
        title: 'Test Document',
        frontmatter: { author: 'Test Author', date: '2025-10-14' },
        content: 'This is test content.',
        links: ['./other.md', './another.md'],
      });

      const content = await readFile(mdFile, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('author: "Test Author"');
      expect(content).toContain('# Test Document');
      expect(content).toContain('This is test content.');
      expect(content).toContain('[Link](./other.md)');
    });

    it('should create config files', async () => {
      const testDir = await createTestDir();
      const configFile = join(testDir, 'config.json');

      await writeTestConfig(configFile, {
        entrypoint: 'README.md',
        rules: { 'orphan-files': 'error' },
      });

      const content = await readFile(configFile, 'utf-8');
      const config = JSON.parse(content);
      expect(config.entrypoint).toBe('README.md');
      expect(config.rules['orphan-files']).toBe('error');
    });

    it('should create complete documentation structures', async () => {
      const testDir = await createTestDir();

      await createTestDocs(testDir, {
        'README.md': {
          content: 'Root document',
          links: ['./guide.md'],
        },
        'guide.md': 'Guide content',
        'docs/api.md': {
          content: 'API documentation',
          links: ['../README.md'],
        },
      });

      const readmeContent = await readFile(join(testDir, 'README.md'), 'utf-8');
      expect(readmeContent).toContain('Root document');
      expect(readmeContent).toContain('[Link](./guide.md)');

      const apiContent = await readFile(join(testDir, 'docs/api.md'), 'utf-8');
      expect(apiContent).toContain('API documentation');
    });
  });

  describe('console capture', () => {
    it('should capture console.log output', () => {
      const capture = new ConsoleCapture();

      capture.start();
      console.log('Test message 1');
      console.log('Test message 2');
      capture.stop();

      const logs = capture.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0]).toBe('Test message 1');
      expect(logs[1]).toBe('Test message 2');
    });

    it('should capture console.error output', () => {
      const capture = new ConsoleCapture();

      capture.start();
      console.error('Error message 1');
      console.error('Error message 2');
      capture.stop();

      const errors = capture.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0]).toBe('Error message 1');
    });

    it('should provide combined output strings', () => {
      const capture = new ConsoleCapture();

      capture.start();
      console.log('Line 1');
      console.log('Line 2');
      console.error('Error 1');
      capture.stop();

      expect(capture.getOutput()).toBe('Line 1\nLine 2');
      expect(capture.getErrorOutput()).toBe('Error 1');
    });

    it('should support clear method', () => {
      const capture = new ConsoleCapture();

      capture.start();
      console.log('Test');
      capture.clear();
      console.log('After clear');
      capture.stop();

      const logs = capture.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toBe('After clear');
    });
  });

  describe('mock logger', () => {
    it('should capture log messages', () => {
      const logger = new MockLogger();

      logger.info('Info message');
      logger.error('Error message');
      logger.success('Success message');

      expect(logger.getLogs()).toHaveLength(3);
      expect(logger.getLogs('info')).toEqual(['Info message']);
      expect(logger.getLogs('error')).toEqual(['Error message']);
      expect(logger.getLogs('success')).toEqual(['Success message']);
    });

    it('should check if message was logged', () => {
      const logger = new MockLogger();

      logger.info('Test message with details');

      expect(logger.hasLog('Test message')).toBe(true);
      expect(logger.hasLog('details')).toBe(true);
      expect(logger.hasLog('missing')).toBe(false);
    });

    it('should count logs by level', () => {
      const logger = new MockLogger();

      logger.info('Info 1');
      logger.info('Info 2');
      logger.error('Error 1');

      expect(logger.getLogCount()).toBe(3);
      expect(logger.getLogCount('info')).toBe(2);
      expect(logger.getLogCount('error')).toBe(1);
    });

    it('should support clear method', () => {
      const logger = new MockLogger();

      logger.info('Test');
      logger.clear();
      logger.success('After clear');

      expect(logger.getLogs()).toHaveLength(1);
      expect(logger.getLogs()[0]).toBe('After clear');
    });
  });

  describe('fixture utilities', () => {
    it('should get fixture paths', () => {
      const fixturePath = getFixturePath('valid-docs', 'README.md');
      // Check for path components instead of exact path separator format
      expect(fixturePath).toContain('tests');
      expect(fixturePath).toContain('fixtures');
      expect(fixturePath).toContain('valid-docs');
      expect(fixturePath).toContain('README.md');
    });

    it('should load fixture files', async () => {
      const content = await loadFixture('valid-docs/README.md');
      expect(content).toContain('# Valid Documentation');
      expect(content).toContain('[Guide](./guide.md)');
    });
  });

  describe('test utilities', () => {
    it('assertArrayContains should validate array membership', () => {
      const actual = ['a', 'b', 'c', 'd'];
      const expected = ['b', 'd'];

      // Should not throw
      assertArrayContains(actual, expected);

      // Should throw for missing items
      expect(() => {
        assertArrayContains(actual, ['e', 'f']);
      }).toThrow('Array missing items');
    });

    it('delay should wait specified time', async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(50);
      expect(elapsed).toBeLessThan(100);
    });

    it('createSpy should track function calls', () => {
      const spy = createSpy<(a: string, b: number) => void>();

      spy('test', 123);
      spy('another', 456);

      expect(spy.callCount).toBe(2);
      expect(spy.calls[0]).toEqual(['test', 123]);
      expect(spy.calls[1]).toEqual(['another', 456]);
    });

    it('spy reset should clear calls', () => {
      const spy = createSpy<() => void>();

      spy();
      spy();
      expect(spy.callCount).toBe(2);

      spy.reset();
      expect(spy.callCount).toBe(0);
      expect(spy.calls).toHaveLength(0);
    });
  });
});
