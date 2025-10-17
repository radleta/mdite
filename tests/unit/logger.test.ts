import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger, shouldUseColors } from '../../src/utils/logger.js';
import type { MockInstance } from 'vitest';

describe('shouldUseColors', () => {
  const originalEnv = { ...process.env };
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    delete process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
    delete process.env.CI;
  });

  afterEach(() => {
    process.env = originalEnv;
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      writable: true,
      configurable: true,
    });
  });

  it('should return false when NO_COLOR env var exists', () => {
    process.env.NO_COLOR = '1';
    expect(shouldUseColors()).toBe(false);
  });

  it('should return false when NO_COLOR is empty string', () => {
    process.env.NO_COLOR = '';
    expect(shouldUseColors()).toBe(false);
  });

  it('should return true when FORCE_COLOR env var exists', () => {
    process.env.FORCE_COLOR = '1';
    Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
    expect(shouldUseColors()).toBe(true);
  });

  it('should prioritize NO_COLOR over FORCE_COLOR', () => {
    process.env.NO_COLOR = '1';
    process.env.FORCE_COLOR = '1';
    expect(shouldUseColors()).toBe(false);
  });

  it('should return false in CI environment by default', () => {
    process.env.CI = 'true';
    expect(shouldUseColors()).toBe(false);
  });

  it('should return true in CI when FORCE_COLOR is set', () => {
    process.env.CI = 'true';
    process.env.FORCE_COLOR = '1';
    expect(shouldUseColors()).toBe(true);
  });

  it('should return true when stdout is TTY', () => {
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      writable: true,
      configurable: true,
    });
    expect(shouldUseColors()).toBe(true);
  });

  it('should return false when stdout is not TTY', () => {
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      writable: true,
      configurable: true,
    });
    expect(shouldUseColors()).toBe(false);
  });

  it('should return false when stdout.isTTY is undefined', () => {
    Object.defineProperty(process.stdout, 'isTTY', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(shouldUseColors()).toBe(false);
  });
});

describe('Logger', () => {
  let consoleLogSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should use provided colors setting', () => {
      const logger = new Logger(true);
      expect(logger).toBeDefined();
    });

    it('should use shouldUseColors when colors not provided', () => {
      const logger = new Logger();
      expect(logger).toBeDefined();
    });

    it('should accept quiet option', () => {
      const logger = new Logger(false, { quiet: true });
      expect(logger).toBeDefined();
    });

    it('should accept verbose option', () => {
      const logger = new Logger(false, { verbose: true });
      expect(logger).toBeDefined();
    });
  });

  describe('header', () => {
    it('should output to stderr in normal mode', () => {
      const logger = new Logger(false);
      logger.header('Test Header');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should be suppressed in quiet mode', () => {
      const logger = new Logger(false, { quiet: true });
      logger.header('Test Header');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should include separator line', () => {
      const logger = new Logger(false);
      logger.header('Test');

      const calls = consoleErrorSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
      expect(calls.some(call => String(call[0]).includes('-'))).toBe(true);
    });
  });

  describe('info', () => {
    it('should output to stderr in normal mode', () => {
      const logger = new Logger(false);
      logger.info('Test info');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test info'));
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should be suppressed in quiet mode', () => {
      const logger = new Logger(false, { quiet: true });
      logger.info('Test info');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should include info icon', () => {
      const logger = new Logger(false);
      logger.info('Test');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('i'));
    });
  });

  describe('success', () => {
    it('should output to stderr in normal mode', () => {
      const logger = new Logger(false);
      logger.success('Test success');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test success'));
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should be suppressed in quiet mode', () => {
      const logger = new Logger(false, { quiet: true });
      logger.success('Test success');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should include success icon', () => {
      const logger = new Logger(false);
      logger.success('Test');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
    });
  });

  describe('error', () => {
    it('should output to stderr', () => {
      const logger = new Logger(false);
      logger.error('Test error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should NOT be suppressed in quiet mode', () => {
      const logger = new Logger(false, { quiet: true });
      logger.error('Test error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
    });

    it('should include error icon', () => {
      const logger = new Logger(false);
      logger.error('Test');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('✗'));
    });

    it('should show stack trace with DEBUG env var', () => {
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = '1';

      const logger = new Logger(false);
      const testError = new Error('Test error');
      logger.error('Error occurred', testError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error occurred'));
      expect(consoleErrorSpy.mock.calls.length).toBeGreaterThan(1);

      if (originalDebug === undefined) {
        delete process.env.DEBUG;
      } else {
        process.env.DEBUG = originalDebug;
      }
    });

    it('should show stack trace in verbose mode', () => {
      const logger = new Logger(false, { verbose: true });
      const testError = new Error('Test error');
      logger.error('Error occurred', testError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error occurred'));
      expect(consoleErrorSpy.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe('debug', () => {
    it('should be suppressed in normal mode', () => {
      const logger = new Logger(false);
      logger.debug('Debug message');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should output to stderr in verbose mode', () => {
      const logger = new Logger(false, { verbose: true });
      logger.debug('Debug message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Debug message'));
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should include debug icon in verbose mode', () => {
      const logger = new Logger(false, { verbose: true });
      logger.debug('Test');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('→'));
    });
  });

  describe('log', () => {
    it('should output to stdout', () => {
      const logger = new Logger(false);
      logger.log('Test data');

      expect(consoleLogSpy).toHaveBeenCalledWith('Test data');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should NOT be suppressed in quiet mode', () => {
      const logger = new Logger(false, { quiet: true });
      logger.log('Test data');

      expect(consoleLogSpy).toHaveBeenCalledWith('Test data');
    });

    it('should output raw data without modification', () => {
      const logger = new Logger(false);
      const testData = 'Raw data without icons';
      logger.log(testData);

      expect(consoleLogSpy).toHaveBeenCalledWith(testData);
    });
  });

  describe('line', () => {
    it('should output blank line to stderr in normal mode', () => {
      const logger = new Logger(false);
      logger.line();

      expect(consoleErrorSpy).toHaveBeenCalledWith('');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should be suppressed in quiet mode', () => {
      const logger = new Logger(false, { quiet: true });
      logger.line();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('colors option', () => {
    it('should use colors when enabled', () => {
      const logger = new Logger(true);
      logger.info('Test');

      // Verify that output was generated (chalk may not add colors in test env, but logger accepts the param)
      expect(consoleErrorSpy).toHaveBeenCalled();
      const output = String(consoleErrorSpy.mock.calls[0]?.[0]);
      expect(output).toContain('Test');
    });

    it('should not use colors when disabled', () => {
      const logger = new Logger(false);
      logger.info('Test');

      const output = consoleErrorSpy.mock.calls[0]?.[0];
      // Should not contain ANSI color codes (plain icon)
      expect(String(output)).toBe('i Test');
    });
  });

  describe('quiet mode behavior', () => {
    it('should suppress informational output but show data', () => {
      const logger = new Logger(false, { quiet: true });

      // Suppressed
      logger.header('Header');
      logger.info('Info');
      logger.success('Success');
      logger.line();
      logger.debug('Debug');

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      // Not suppressed
      logger.log('Data');
      logger.error('Error');

      expect(consoleLogSpy).toHaveBeenCalledWith('Data');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error'));
    });
  });

  describe('verbose mode behavior', () => {
    it('should show debug messages in verbose mode', () => {
      const logger = new Logger(false, { verbose: true });

      logger.debug('Debug message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Debug message'));
    });

    it('should show stack traces in verbose mode', () => {
      const logger = new Logger(false, { verbose: true });
      const error = new Error('Test error');

      logger.error('An error occurred', error);

      // Should have called console.error at least twice (once for message, once for stack)
      expect(consoleErrorSpy.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
