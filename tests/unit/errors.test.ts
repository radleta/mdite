import { describe, it, expect } from 'vitest';
import {
  DocLintError,
  FileNotFoundError,
  InvalidConfigError,
  ConfigNotFoundError,
  DirectoryNotFoundError,
  FileReadError,
  FileWriteError,
  ValidationError,
  SchemaValidationError,
  GraphBuildError,
  DeadLinkError,
  DeadAnchorError,
  MarkdownParseError,
  FrontmatterParseError,
  InvalidArgumentError,
  MissingArgumentError,
  OperationCancelledError,
  TimeoutError,
  isDocLintError,
  isFileNotFoundError,
  isConfigError,
  formatError,
  getExitCode,
  toError,
} from '../../src/utils/errors.js';

describe('Error System', () => {
  describe('DocLintError', () => {
    it('should create error with message', () => {
      const error = new DocLintError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('DocLintError');
      expect(error.code).toBe('DOC_LINT_ERROR');
      expect(error.exitCode).toBe(1);
    });

    it('should create error with custom options', () => {
      const error = new DocLintError('Test error', {
        code: 'CUSTOM_CODE',
        exitCode: 2,
        context: { foo: 'bar' },
      });
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.exitCode).toBe(2);
      expect(error.context).toEqual({ foo: 'bar' });
    });

    it('should include context', () => {
      const error = new DocLintError('Test', {
        context: { foo: 'bar', count: 42 },
      });
      expect(error.context).toEqual({ foo: 'bar', count: 42 });
    });

    it('should store cause error', () => {
      const cause = new Error('Original error');
      const error = new DocLintError('Wrapped error', { cause });
      expect(error.cause).toBe(cause);
    });

    it('should format user message', () => {
      const error = new DocLintError('Test error');
      const msg = error.toUserMessage();
      expect(msg).toContain('DocLintError');
      expect(msg).toContain('Test error');
    });

    it('should format user message with context in verbose mode', () => {
      const error = new DocLintError('Test error', {
        context: { file: 'test.md', line: 42 },
      });
      const msg = error.toUserMessage(true);
      expect(msg).toContain('Context:');
      expect(msg).toContain('file');
      expect(msg).toContain('test.md');
    });

    it('should format user message with stack trace in verbose mode', () => {
      const error = new DocLintError('Test error');
      const msg = error.toUserMessage(true);
      expect(msg).toContain('Stack trace:');
    });

    it('should have stack trace', () => {
      const error = new DocLintError('Test');
      expect(error.stack).toBeDefined();
    });
  });

  describe('Configuration errors', () => {
    describe('InvalidConfigError', () => {
      it('should create with message and context', () => {
        const error = new InvalidConfigError('Invalid format', { format: 'yaml' });
        expect(error.message).toBe('Invalid format');
        expect(error.code).toBe('INVALID_CONFIG');
        expect(error.context).toEqual({ format: 'yaml' });
      });

      it('should be instance of DocLintError', () => {
        const error = new InvalidConfigError('Test');
        expect(error).toBeInstanceOf(DocLintError);
        expect(error).toBeInstanceOf(InvalidConfigError);
      });
    });

    describe('ConfigNotFoundError', () => {
      it('should create with path', () => {
        const error = new ConfigNotFoundError('/path/to/.doclintrc');
        expect(error.message).toContain('/path/to/.doclintrc');
        expect(error.code).toBe('CONFIG_NOT_FOUND');
        expect(error.context?.path).toBe('/path/to/.doclintrc');
      });
    });
  });

  describe('File system errors', () => {
    describe('FileNotFoundError', () => {
      it('should create with path context', () => {
        const error = new FileNotFoundError('/path/to/file.md');
        expect(error.message).toContain('/path/to/file.md');
        expect(error.code).toBe('FILE_NOT_FOUND');
        expect(error.context?.path).toBe('/path/to/file.md');
      });
    });

    describe('DirectoryNotFoundError', () => {
      it('should create with path', () => {
        const error = new DirectoryNotFoundError('/docs');
        expect(error.message).toContain('/docs');
        expect(error.code).toBe('DIRECTORY_NOT_FOUND');
        expect(error.context?.path).toBe('/docs');
      });
    });

    describe('FileReadError', () => {
      it('should create with path and optional cause', () => {
        const cause = new Error('Permission denied');
        const error = new FileReadError('/file.md', cause);
        expect(error.message).toContain('/file.md');
        expect(error.code).toBe('FILE_READ_ERROR');
        expect(error.cause).toBe(cause);
      });
    });

    describe('FileWriteError', () => {
      it('should create with path and optional cause', () => {
        const cause = new Error('Disk full');
        const error = new FileWriteError('/output.json', cause);
        expect(error.message).toContain('/output.json');
        expect(error.code).toBe('FILE_WRITE_ERROR');
        expect(error.cause).toBe(cause);
      });
    });
  });

  describe('Validation errors', () => {
    describe('ValidationError', () => {
      it('should create with message and context', () => {
        const error = new ValidationError('Invalid input', { field: 'email' });
        expect(error.message).toBe('Invalid input');
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.context).toEqual({ field: 'email' });
      });
    });

    describe('SchemaValidationError', () => {
      it('should create with schema and data', () => {
        const schema = { type: 'string' };
        const data = 123;
        const error = new SchemaValidationError('Type mismatch', schema, data);
        expect(error.message).toContain('Schema validation failed');
        expect(error.code).toBe('SCHEMA_VALIDATION_ERROR');
        expect(error.context?.schema).toEqual(schema);
        expect(error.context?.data).toBe(data);
      });
    });
  });

  describe('Graph/Link errors', () => {
    describe('GraphBuildError', () => {
      it('should create with message and context', () => {
        const error = new GraphBuildError('Circular dependency', { nodes: ['a', 'b'] });
        expect(error.message).toContain('Failed to build dependency graph');
        expect(error.code).toBe('GRAPH_BUILD_ERROR');
        expect(error.context).toEqual({ nodes: ['a', 'b'] });
      });
    });

    describe('DeadLinkError', () => {
      it('should create with source and target', () => {
        const error = new DeadLinkError('docs/README.md', './missing.md');
        expect(error.message).toContain('docs/README.md');
        expect(error.message).toContain('./missing.md');
        expect(error.code).toBe('DEAD_LINK');
        expect(error.context?.sourceFile).toBe('docs/README.md');
        expect(error.context?.targetLink).toBe('./missing.md');
      });
    });

    describe('DeadAnchorError', () => {
      it('should create with source, target, and anchor', () => {
        const error = new DeadAnchorError('docs/guide.md', 'api.md', 'missing-section');
        expect(error.message).toContain('docs/guide.md');
        expect(error.message).toContain('api.md#missing-section');
        expect(error.code).toBe('DEAD_ANCHOR');
        expect(error.context?.sourceFile).toBe('docs/guide.md');
        expect(error.context?.targetFile).toBe('api.md');
        expect(error.context?.anchor).toBe('missing-section');
      });
    });
  });

  describe('Parsing errors', () => {
    describe('MarkdownParseError', () => {
      it('should create with file and optional cause', () => {
        const cause = new Error('Malformed markdown');
        const error = new MarkdownParseError('broken.md', cause);
        expect(error.message).toContain('broken.md');
        expect(error.code).toBe('MARKDOWN_PARSE_ERROR');
        expect(error.cause).toBe(cause);
      });
    });

    describe('FrontmatterParseError', () => {
      it('should create with file and optional cause', () => {
        const cause = new Error('Invalid YAML');
        const error = new FrontmatterParseError('post.md', cause);
        expect(error.message).toContain('post.md');
        expect(error.code).toBe('FRONTMATTER_PARSE_ERROR');
        expect(error.cause).toBe(cause);
      });
    });
  });

  describe('CLI errors', () => {
    describe('InvalidArgumentError', () => {
      it('should create with argument and reason', () => {
        const error = new InvalidArgumentError('--format', 'Must be "text" or "json"');
        expect(error.message).toContain('--format');
        expect(error.message).toContain('Must be "text" or "json"');
        expect(error.code).toBe('INVALID_ARGUMENT');
        expect(error.context?.argument).toBe('--format');
        expect(error.context?.reason).toBe('Must be "text" or "json"');
      });
    });

    describe('MissingArgumentError', () => {
      it('should create with argument name', () => {
        const error = new MissingArgumentError('path');
        expect(error.message).toContain('path');
        expect(error.code).toBe('MISSING_ARGUMENT');
        expect(error.context?.argument).toBe('path');
      });
    });
  });

  describe('Runtime errors', () => {
    describe('OperationCancelledError', () => {
      it('should create with operation name', () => {
        const error = new OperationCancelledError('file processing');
        expect(error.message).toContain('file processing');
        expect(error.code).toBe('OPERATION_CANCELLED');
        expect(error.exitCode).toBe(130);
      });
    });

    describe('TimeoutError', () => {
      it('should create with operation and timeout', () => {
        const error = new TimeoutError('network request', 5000);
        expect(error.message).toContain('network request');
        expect(error.message).toContain('5000');
        expect(error.code).toBe('TIMEOUT');
        expect(error.context?.timeout).toBe(5000);
      });
    });
  });

  describe('Type guards', () => {
    it('should identify DocLintError', () => {
      const error = new DocLintError('Test');
      expect(isDocLintError(error)).toBe(true);
      expect(isDocLintError(new Error())).toBe(false);
      expect(isDocLintError('not an error')).toBe(false);
      expect(isDocLintError(null)).toBe(false);
    });

    it('should identify FileNotFoundError', () => {
      const error = new FileNotFoundError('/test');
      expect(isFileNotFoundError(error)).toBe(true);
      expect(isFileNotFoundError(new DocLintError('test'))).toBe(false);
      expect(isFileNotFoundError(new Error())).toBe(false);
    });

    it('should identify config errors', () => {
      const invalidConfig = new InvalidConfigError('test');
      const notFound = new ConfigNotFoundError('/config');
      const other = new FileNotFoundError('/file');

      expect(isConfigError(invalidConfig)).toBe(true);
      expect(isConfigError(notFound)).toBe(true);
      expect(isConfigError(other)).toBe(false);
    });
  });

  describe('Utilities', () => {
    describe('formatError', () => {
      it('should format DocLintError', () => {
        const error = new FileNotFoundError('/test.md');
        const formatted = formatError(error);
        expect(formatted).toContain('FileNotFoundError');
        expect(formatted).toContain('/test.md');
      });

      it('should format DocLintError with verbose mode', () => {
        const error = new FileNotFoundError('/test.md');
        const formatted = formatError(error, true);
        expect(formatted).toContain('Context:');
        expect(formatted).toContain('Stack trace:');
      });

      it('should format regular Error', () => {
        const error = new Error('Generic error');
        const formatted = formatError(error);
        expect(formatted).toContain('Error:');
        expect(formatted).toContain('Generic error');
      });

      it('should format regular Error with verbose mode', () => {
        const error = new Error('Generic error');
        const formatted = formatError(error, true);
        expect(formatted).toContain('at ');
      });

      it('should format unknown errors', () => {
        const formatted = formatError('string error');
        expect(formatted).toContain('Unknown error');
        expect(formatted).toContain('string error');
      });
    });

    describe('getExitCode', () => {
      it('should get exit code from DocLintError', () => {
        const error = new DocLintError('Test', { exitCode: 2 });
        expect(getExitCode(error)).toBe(2);
      });

      it('should get default exit code from DocLintError', () => {
        const error = new DocLintError('Test');
        expect(getExitCode(error)).toBe(1);
      });

      it('should get exit code from OperationCancelledError', () => {
        const error = new OperationCancelledError('test');
        expect(getExitCode(error)).toBe(130);
      });

      it('should return 1 for regular errors', () => {
        expect(getExitCode(new Error())).toBe(1);
      });

      it('should return 1 for unknown errors', () => {
        expect(getExitCode('string error')).toBe(1);
      });
    });

    describe('toError', () => {
      it('should return Error as-is', () => {
        const error = new Error('Test');
        expect(toError(error)).toBe(error);
      });

      it('should convert string to Error', () => {
        const error = toError('Test error');
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Test error');
      });

      it('should convert number to Error', () => {
        const error = toError(404);
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('404');
      });

      it('should convert object to Error', () => {
        const error = toError({ code: 'ERR' });
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('[object Object]');
      });
    });
  });

  describe('Error inheritance', () => {
    it('should maintain prototype chain', () => {
      const error = new InvalidConfigError('Test');
      expect(Object.getPrototypeOf(error)).toBe(InvalidConfigError.prototype);
      expect(Object.getPrototypeOf(Object.getPrototypeOf(error))).toBe(DocLintError.prototype);
    });

    it('should support instanceof checks', () => {
      const docError = new DocLintError('Test');
      const configError = new InvalidConfigError('Test');
      const fileError = new FileNotFoundError('/test');

      expect(docError instanceof DocLintError).toBe(true);
      expect(docError instanceof InvalidConfigError).toBe(false);
      expect(docError instanceof FileNotFoundError).toBe(false);

      expect(configError instanceof DocLintError).toBe(true);
      expect(configError instanceof InvalidConfigError).toBe(true);
      expect(configError instanceof FileNotFoundError).toBe(false);

      expect(fileError instanceof DocLintError).toBe(true);
      expect(fileError instanceof InvalidConfigError).toBe(false);
      expect(fileError instanceof FileNotFoundError).toBe(true);
    });
  });

  describe('Error usage patterns', () => {
    it('should work with throw/catch', () => {
      expect(() => {
        throw new FileNotFoundError('/test');
      }).toThrow('File not found');
    });

    it('should work with try/catch', () => {
      try {
        throw new InvalidConfigError('Test error');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidConfigError);
        expect((error as InvalidConfigError).message).toBe('Test error');
      }
    });

    it('should work in promise rejections', () => {
      const promise = Promise.reject(new InvalidConfigError('Config failed'));
      return expect(promise).rejects.toBeInstanceOf(InvalidConfigError);
    });

    it('should work with async/await', async () => {
      const asyncFunction = async () => {
        throw new FileNotFoundError('/async.md');
      };

      await expect(asyncFunction()).rejects.toThrow('File not found');
      await expect(asyncFunction()).rejects.toBeInstanceOf(FileNotFoundError);
    });

    it('should preserve error message in different contexts', () => {
      const error = new FileNotFoundError('/docs/guide.md');
      expect(error.message).toContain('/docs/guide.md');
      expect(error.toString()).toContain('/docs/guide.md');
    });

    it('should work with Error.captureStackTrace', () => {
      const error = new DocLintError('Test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('DocLintError');
    });
  });
});
