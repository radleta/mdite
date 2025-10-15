import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../../src/utils/logger.js';
import type { MockInstance } from 'vitest';

describe('Logger', () => {
  let consoleLogSpy: MockInstance;
  let consoleErrorSpy: MockInstance;
  let originalLog: typeof console.log;
  let originalError: typeof console.error;

  beforeEach(() => {
    originalLog = console.log;
    originalError = console.error;
    consoleLogSpy = vi.fn();
    consoleErrorSpy = vi.fn();
    console.log = consoleLogSpy as unknown as typeof console.log;
    console.error = consoleErrorSpy as unknown as typeof console.error;
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
  });

  describe('constructor', () => {
    it('should create logger with colors enabled by default', () => {
      const logger = new Logger();
      logger.info('test');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create logger with colors disabled', () => {
      const logger = new Logger(false);
      logger.info('test');
      expect(consoleLogSpy).toHaveBeenCalledWith('i test');
    });

    it('should create logger with colors explicitly enabled', () => {
      const logger = new Logger(true);
      logger.info('test');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('header', () => {
    it('should print header with colors', () => {
      const logger = new Logger(true);
      logger.header('Test Header');

      expect(consoleLogSpy).toHaveBeenCalledTimes(3); // empty line, header, separator
    });

    it('should print header without colors', () => {
      const logger = new Logger(false);
      logger.header('Test Header');

      expect(consoleLogSpy).toHaveBeenCalledWith('');
      expect(consoleLogSpy).toHaveBeenCalledWith('Test Header');
      expect(consoleLogSpy).toHaveBeenCalledWith('-'.repeat(50));
    });

    it('should add blank line before header', () => {
      const logger = new Logger(false);
      logger.header('Header');

      expect(consoleLogSpy.mock.calls[0]?.[0]).toBe('');
    });

    it('should add separator line', () => {
      const logger = new Logger(false);
      logger.header('Header');

      const calls = consoleLogSpy.mock.calls;
      expect(calls[2]?.[0]).toBe('-'.repeat(50));
    });
  });

  describe('info', () => {
    it('should print info message with icon', () => {
      const logger = new Logger(false);
      logger.info('Information message');

      expect(consoleLogSpy).toHaveBeenCalledWith('i Information message');
    });

    it('should print info message with colored icon', () => {
      const logger = new Logger(true);
      logger.info('Info');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toContain('Info');
    });

    it('should handle empty message', () => {
      const logger = new Logger(false);
      logger.info('');

      expect(consoleLogSpy).toHaveBeenCalledWith('i ');
    });

    it('should handle long messages', () => {
      const logger = new Logger(false);
      const longMessage = 'A'.repeat(200);
      logger.info(longMessage);

      expect(consoleLogSpy).toHaveBeenCalledWith(`i ${longMessage}`);
    });
  });

  describe('success', () => {
    it('should print success message with checkmark', () => {
      const logger = new Logger(false);
      logger.success('Operation successful');

      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Operation successful');
    });

    it('should print success message with colored checkmark', () => {
      const logger = new Logger(true);
      logger.success('Success');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toContain('Success');
    });

    it('should handle empty success message', () => {
      const logger = new Logger(false);
      logger.success('');

      expect(consoleLogSpy).toHaveBeenCalledWith('✓ ');
    });
  });

  describe('error', () => {
    it('should print error message with X icon', () => {
      const logger = new Logger(false);
      logger.error('Error occurred');

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Error occurred');
    });

    it('should print error message with colored X icon', () => {
      const logger = new Logger(true);
      logger.error('Error');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const output = consoleErrorSpy.mock.calls[0]?.[0];
      expect(output).toContain('Error');
    });

    it('should not print stack trace without DEBUG', () => {
      const logger = new Logger(false);
      const error = new Error('Test error');
      logger.error('Error message', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Error message');
    });

    it('should print stack trace with DEBUG env var', () => {
      const originalDebug = process.env['DEBUG'];
      process.env['DEBUG'] = '1';

      const logger = new Logger(false);
      const error = new Error('Test error');
      logger.error('Error message', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Error message');

      process.env['DEBUG'] = originalDebug;
    });

    it('should handle error without stack trace', () => {
      const originalDebug = process.env['DEBUG'];
      process.env['DEBUG'] = '1';

      const logger = new Logger(false);
      const error = new Error('No stack');
      delete error.stack;
      logger.error('Error', error);

      expect(consoleErrorSpy).toHaveBeenCalled();

      process.env['DEBUG'] = originalDebug;
    });
  });

  describe('log', () => {
    it('should print plain message', () => {
      const logger = new Logger();
      logger.log('Plain message');

      expect(consoleLogSpy).toHaveBeenCalledWith('Plain message');
    });

    it('should not add any formatting', () => {
      const logger = new Logger(false);
      logger.log('No formatting');

      expect(consoleLogSpy).toHaveBeenCalledWith('No formatting');
    });

    it('should work with colors enabled', () => {
      const logger = new Logger(true);
      logger.log('Message');

      expect(consoleLogSpy).toHaveBeenCalledWith('Message');
    });

    it('should handle empty string', () => {
      const logger = new Logger();
      logger.log('');

      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });
  });

  describe('line', () => {
    it('should print blank line', () => {
      const logger = new Logger();
      logger.line();

      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });

    it('should work with colors disabled', () => {
      const logger = new Logger(false);
      logger.line();

      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });

    it('should be callable multiple times', () => {
      const logger = new Logger();
      logger.line();
      logger.line();
      logger.line();

      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('combined usage', () => {
    it('should support chaining multiple log calls', () => {
      const logger = new Logger(false);

      logger.header('Test');
      logger.info('Info');
      logger.success('Success');
      logger.error('Error');
      logger.log('Log');
      logger.line();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should maintain consistent formatting', () => {
      const logger = new Logger(false);

      logger.info('First');
      logger.info('Second');
      logger.success('Third');

      expect(consoleLogSpy.mock.calls[0]?.[0]).toBe('i First');
      expect(consoleLogSpy.mock.calls[1]?.[0]).toBe('i Second');
      expect(consoleLogSpy.mock.calls[2]?.[0]).toBe('✓ Third');
    });

    it('should work in realistic scenario', () => {
      const logger = new Logger(false);

      logger.header('Linting Documentation');
      logger.info('Scanning files...');
      logger.success('Found 10 files');
      logger.info('Validating links...');
      logger.error('Found 2 broken links');
      logger.line();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('color modes', () => {
    it('should respect color setting throughout lifecycle', () => {
      const logger = new Logger(false);

      logger.info('Info 1');
      logger.success('Success 1');
      logger.error('Error 1');

      const allOutput = [
        ...consoleLogSpy.mock.calls.map((c: unknown[]) => c[0] as string),
        ...consoleErrorSpy.mock.calls.map((c: unknown[]) => c[0] as string),
      ];

      // All output should use plain icons
      expect(allOutput.some(o => o.includes('i Info 1'))).toBe(true);
      expect(allOutput.some(o => o.includes('✓ Success 1'))).toBe(true);
      expect(allOutput.some(o => o.includes('✗ Error 1'))).toBe(true);
    });
  });
});
