import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleError, withErrorHandler } from '../../src/utils/error-handler.js';
import { DocLintError, FileNotFoundError } from '../../src/utils/errors.js';
import type { MockInstance } from 'vitest';

describe('Error Handler', () => {
  let consoleErrorSpy: MockInstance;
  let processExitSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('handleError', () => {
    it('should handle DocLintError', async () => {
      const error = new FileNotFoundError('/test.md');
      await handleError(error, { exit: false });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorMessage = consoleErrorSpy.mock.calls[0]?.[0];
      expect(errorMessage).toContain('FileNotFoundError');
      expect(errorMessage).toContain('/test.md');
    });

    it('should handle regular Error', async () => {
      const error = new Error('Generic error');
      await handleError(error, { exit: false });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorMessage = consoleErrorSpy.mock.calls[0]?.[0];
      expect(errorMessage).toContain('Generic error');
    });

    it('should handle unknown errors', async () => {
      await handleError('string error', { exit: false });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorMessage = consoleErrorSpy.mock.calls[0]?.[0];
      expect(errorMessage).toContain('Unknown error');
    });

    it('should exit with correct exit code', async () => {
      const error = new DocLintError('Test', { exitCode: 2 });
      await handleError(error, { exit: true });

      expect(processExitSpy).toHaveBeenCalledWith(2);
    });

    it('should not exit when exit option is false', async () => {
      const error = new DocLintError('Test');
      await handleError(error, { exit: false });

      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should show verbose output when verbose is true', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const error = new DocLintError('Test', {
        code: 'TEST_CODE',
        context: { foo: 'bar' },
      });

      await handleError(error, { verbose: true, exit: false });

      // Check that error message and context were logged
      expect(consoleErrorSpy).toHaveBeenCalled();
      const allLogs = [
        ...consoleErrorSpy.mock.calls.map((c: unknown[]) => c[0]),
        ...consoleSpy.mock.calls.map((c: unknown[]) => c[0]),
      ].join(' ');

      expect(allLogs).toContain('Context:');
      expect(allLogs).toContain('Stack trace:');

      consoleSpy.mockRestore();
    });

    it('should work with colors disabled', async () => {
      const error = new FileNotFoundError('/test.md');
      await handleError(error, { colors: false, exit: false });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('withErrorHandler', () => {
    it('should return result on success', async () => {
      const fn = async (x: number) => x * 2;
      const wrapped = withErrorHandler(fn, {});

      const result = await wrapped(5);
      expect(result).toBe(10);
    });

    it('should handle errors and exit', async () => {
      const fn = async () => {
        throw new FileNotFoundError('/test.md');
      };
      const wrapped = withErrorHandler(fn, {});

      await wrapped();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should pass through function arguments', async () => {
      const fn = async (a: number, b: string) => `${a}-${b}`;
      const wrapped = withErrorHandler(fn, {});

      const result = await wrapped(42, 'test');
      expect(result).toBe('42-test');
    });

    it('should handle multiple arguments', async () => {
      const fn = async (a: number, b: number, c: number) => a + b + c;
      const wrapped = withErrorHandler(fn, {});

      const result = await wrapped(1, 2, 3);
      expect(result).toBe(6);
    });

    it('should respect verbose option', async () => {
      const fn = async () => {
        throw new DocLintError('Test error', { context: { test: true } });
      };
      const wrapped = withErrorHandler(fn, { verbose: true });

      await wrapped();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should respect colors option', async () => {
      const fn = async () => {
        throw new Error('Test');
      };
      const wrapped = withErrorHandler(fn, { colors: false });

      await wrapped();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should return undefined after error handling', async () => {
      const fn = async (): Promise<string> => {
        throw new Error('Test');
      };
      const wrapped = withErrorHandler(fn, {});

      const result = await wrapped();
      expect(result).toBeUndefined();
    });
  });
});
