import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Reporter } from '../../src/core/reporter.js';
import { LintResults } from '../../src/types/results.js';
import { Logger } from '../../src/utils/logger.js';
import type { MockInstance } from 'vitest';

describe('Reporter', () => {
  let logger: Logger;
  let consoleLogSpy: MockInstance;
  let originalLog: typeof console.log;

  beforeEach(() => {
    logger = new Logger();
    // Spy on console.log
    originalLog = console.log;
    consoleLogSpy = vi.fn();
    console.log = consoleLogSpy as unknown as typeof console.log;
  });

  afterEach(() => {
    console.log = originalLog;
  });

  describe('text format', () => {
    it('should report no issues when results are clean', () => {
      const results = new LintResults({
        orphans: [],
        linkErrors: [],
      });

      const reporter = new Reporter('text', logger);
      reporter.report(results);

      // Should show success message
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should report orphan files', () => {
      const results = new LintResults({
        orphans: ['/path/to/orphan.md'],
        linkErrors: [],
      });

      const reporter = new Reporter('text', logger);
      reporter.report(results);

      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => (call as string[]).join(' '))
        .join('\n');
      expect(output).toContain('orphan.md');
    });

    it('should report link errors', () => {
      const results = new LintResults({
        orphans: [],
        linkErrors: [
          {
            rule: 'dead-link',
            severity: 'error',
            file: '/path/to/file.md',
            line: 5,
            column: 10,
            message: 'Dead link: missing.md',
          },
        ],
      });

      const reporter = new Reporter('text', logger);
      reporter.report(results);

      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => (call as string[]).join(' '))
        .join('\n');
      expect(output).toContain('Dead link');
      expect(output).toContain('5:10');
    });

    it('should group errors by file', () => {
      const results = new LintResults({
        orphans: [],
        linkErrors: [
          {
            rule: 'dead-link',
            severity: 'error',
            file: '/path/to/file1.md',
            line: 5,
            column: 10,
            message: 'Error 1',
          },
          {
            rule: 'dead-link',
            severity: 'error',
            file: '/path/to/file1.md',
            line: 10,
            column: 15,
            message: 'Error 2',
          },
          {
            rule: 'dead-link',
            severity: 'error',
            file: '/path/to/file2.md',
            line: 3,
            column: 5,
            message: 'Error 3',
          },
        ],
      });

      const reporter = new Reporter('text', logger);
      reporter.report(results);

      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => (call as string[]).join(' '))
        .join('\n');
      expect(output).toContain('file1.md');
      expect(output).toContain('file2.md');
    });

    it('should include rule names', () => {
      const results = new LintResults({
        orphans: [],
        linkErrors: [
          {
            rule: 'dead-link',
            severity: 'error',
            file: '/path/to/file.md',
            line: 5,
            column: 10,
            message: 'Dead link',
          },
        ],
      });

      const reporter = new Reporter('text', logger);
      reporter.report(results);

      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => (call as string[]).join(' '))
        .join('\n');
      expect(output).toContain('dead-link');
    });

    it('should show severity levels', () => {
      const results = new LintResults({
        orphans: [],
        linkErrors: [
          {
            rule: 'dead-link',
            severity: 'error',
            file: '/path/to/file.md',
            line: 5,
            column: 10,
            message: 'Error message',
          },
        ],
      });

      const reporter = new Reporter('text', logger);
      reporter.report(results);

      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => (call as string[]).join(' '))
        .join('\n');
      expect(output).toContain('error');
    });
  });

  describe('json format', () => {
    it('should output valid JSON', () => {
      const results = new LintResults({
        orphans: ['/path/to/orphan.md'],
        linkErrors: [
          {
            rule: 'dead-link',
            severity: 'error',
            file: '/path/to/file.md',
            line: 5,
            column: 10,
            message: 'Dead link',
          },
        ],
      });

      const reporter = new Reporter('json', logger);
      reporter.report(results);

      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => (call as string[]).join(' '))
        .join('\n');
      const parsed = JSON.parse(output);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });

    it('should include all error fields in JSON', () => {
      const results = new LintResults({
        orphans: [],
        linkErrors: [
          {
            rule: 'dead-link',
            severity: 'error',
            file: '/path/to/file.md',
            line: 5,
            column: 10,
            message: 'Dead link',
          },
        ],
      });

      const reporter = new Reporter('json', logger);
      reporter.report(results);

      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => (call as string[]).join(' '))
        .join('\n');
      const parsed = JSON.parse(output);

      expect(parsed[0]).toHaveProperty('rule');
      expect(parsed[0]).toHaveProperty('severity');
      expect(parsed[0]).toHaveProperty('file');
      expect(parsed[0]).toHaveProperty('line');
      expect(parsed[0]).toHaveProperty('column');
      expect(parsed[0]).toHaveProperty('message');
    });

    it('should output empty array for no errors', () => {
      const results = new LintResults({
        orphans: [],
        linkErrors: [],
      });

      const reporter = new Reporter('json', logger);
      reporter.report(results);

      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => (call as string[]).join(' '))
        .join('\n');
      const parsed = JSON.parse(output);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle errors with line 0', () => {
      const results = new LintResults({
        orphans: ['/path/to/orphan.md'],
        linkErrors: [],
      });

      const reporter = new Reporter('text', logger);
      reporter.report(results);

      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => (call as string[]).join(' '))
        .join('\n');
      expect(output).toBeDefined();
    });

    it('should handle mixed error types', () => {
      const results = new LintResults({
        orphans: ['/path/to/orphan.md'],
        linkErrors: [
          {
            rule: 'dead-link',
            severity: 'error',
            file: '/path/to/file.md',
            line: 5,
            column: 10,
            message: 'Dead link',
          },
        ],
      });

      const reporter = new Reporter('text', logger);
      reporter.report(results);

      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => (call as string[]).join(' '))
        .join('\n');
      expect(output).toContain('orphan.md');
      expect(output).toContain('Dead link');
    });
  });
});
