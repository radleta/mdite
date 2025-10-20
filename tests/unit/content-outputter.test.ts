import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ContentOutputter } from '../../src/core/content-outputter.js';
import { DocGraph } from '../../src/types/graph.js';
import { MarkdownCache } from '../../src/core/markdown-cache.js';
import { Logger } from '../../src/utils/logger.js';

describe('ContentOutputter', () => {
  let graph: DocGraph;
  let cache: MarkdownCache;
  let logger: Logger;
  let outputter: ContentOutputter;

  beforeEach(() => {
    graph = new DocGraph();
    cache = new MarkdownCache();
    logger = new Logger(false, { quiet: true }); // Use quiet mode to suppress output in tests
    outputter = new ContentOutputter(graph, cache, logger);

    // Spy on logger methods
    vi.spyOn(logger, 'log');
    vi.spyOn(logger, 'info');
  });

  describe('output', () => {
    it('should output files in dependency order by default', async () => {
      // Setup graph
      graph.addFile('/README.md', 0);
      graph.addFile('/guide.md', 1);
      graph.addEdge('/README.md', '/guide.md');

      // Mock cache content
      vi.spyOn(cache, 'getContent')
        .mockResolvedValueOnce('# Guide\nContent of guide')
        .mockResolvedValueOnce('# README\nContent of readme');

      await outputter.output({ order: 'deps', basePath: '/' });

      // Should call log twice (once for each file, separator included in first)
      expect(logger.log).toHaveBeenCalledTimes(2); // 2 files
      expect(logger.log).toHaveBeenNthCalledWith(1, '# Guide\nContent of guide\n\n');
      expect(logger.log).toHaveBeenNthCalledWith(2, '# README\nContent of readme');
    });

    it('should output files in alphabetical order when order=alpha', async () => {
      // Setup graph
      graph.addFile('/z-file.md', 0);
      graph.addFile('/a-file.md', 0);

      // Mock cache content
      vi.spyOn(cache, 'getContent')
        .mockResolvedValueOnce('# A File')
        .mockResolvedValueOnce('# Z File');

      await outputter.output({ order: 'alpha', basePath: '/' });

      // Files should be in alphabetical order
      expect(logger.log).toHaveBeenCalledTimes(2); // 2 files
      expect(logger.log).toHaveBeenNthCalledWith(1, '# A File\n\n');
      expect(logger.log).toHaveBeenNthCalledWith(2, '# Z File');
    });

    it('should use custom separator when provided', async () => {
      graph.addFile('/a.md', 0);
      graph.addFile('/b.md', 0);

      vi.spyOn(cache, 'getContent')
        .mockResolvedValueOnce('Content A')
        .mockResolvedValueOnce('Content B');

      await outputter.output({
        order: 'alpha',
        separator: '\n---\n',
        basePath: '/',
      });

      expect(logger.log).toHaveBeenCalledTimes(2);
      expect(logger.log).toHaveBeenNthCalledWith(1, 'Content A\n---\n');
    });

    it('should not add separator after last file', async () => {
      graph.addFile('/a.md', 0);

      vi.spyOn(cache, 'getContent').mockResolvedValueOnce('Content A');

      await outputter.output({ order: 'alpha', basePath: '/' });

      // Should only call log once (no separator after last file)
      expect(logger.log).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledWith('Content A');
    });

    it('should handle empty graph', async () => {
      await outputter.output({ order: 'deps', basePath: '/' });

      // Should not output anything
      expect(logger.log).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('No files to output');
    });
  });

  describe('JSON format', () => {
    it('should output files as JSON with metadata', async () => {
      graph.addFile('/test.md', 0);

      vi.spyOn(cache, 'getContent').mockResolvedValueOnce('# Test\n\nThis is a test file.');

      await outputter.output({
        order: 'deps',
        format: 'json',
        basePath: '/',
      });

      // Should output JSON
      expect(logger.log).toHaveBeenCalledTimes(1);
      const jsonOutput = (logger.log as Mock).mock.calls[0][0] as string;
      const parsed = JSON.parse(jsonOutput);

      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({
        file: 'test.md',
        depth: 0,
        content: '# Test\n\nThis is a test file.',
        wordCount: 7, // "#", "Test", "This", "is", "a", "test", "file."
        lineCount: 3,
      });
    });

    it('should calculate word count correctly', async () => {
      graph.addFile('/test.md', 0);

      vi.spyOn(cache, 'getContent').mockResolvedValueOnce('One two three four five');

      await outputter.output({
        order: 'deps',
        format: 'json',
        basePath: '/',
      });

      const jsonOutput = (logger.log as Mock).mock.calls[0][0] as string;
      const parsed = JSON.parse(jsonOutput);

      expect(parsed[0].wordCount).toBe(5);
    });

    it('should calculate line count correctly', async () => {
      graph.addFile('/test.md', 0);

      vi.spyOn(cache, 'getContent').mockResolvedValueOnce('Line 1\nLine 2\nLine 3');

      await outputter.output({
        order: 'deps',
        format: 'json',
        basePath: '/',
      });

      const jsonOutput = (logger.log as Mock).mock.calls[0][0] as string;
      const parsed = JSON.parse(jsonOutput);

      expect(parsed[0].lineCount).toBe(3);
    });

    it('should include relative paths in JSON output', async () => {
      graph.addFile('/docs/guide.md', 0);

      vi.spyOn(cache, 'getContent').mockResolvedValueOnce('# Guide');

      await outputter.output({
        order: 'deps',
        format: 'json',
        basePath: '/docs',
      });

      const jsonOutput = (logger.log as Mock).mock.calls[0][0] as string;
      const parsed = JSON.parse(jsonOutput);

      expect(parsed[0].file).toBe('guide.md');
    });

    it('should output multiple files as JSON array', async () => {
      graph.addFile('/a.md', 0);
      graph.addFile('/b.md', 1);

      vi.spyOn(cache, 'getContent')
        .mockResolvedValueOnce('Content A')
        .mockResolvedValueOnce('Content B');

      await outputter.output({
        order: 'alpha',
        format: 'json',
        basePath: '/',
      });

      const jsonOutput = (logger.log as Mock).mock.calls[0][0] as string;
      const parsed = JSON.parse(jsonOutput);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].file).toBe('a.md');
      expect(parsed[1].file).toBe('b.md');
    });
  });

  describe('progress messages', () => {
    it('should log progress messages to stderr', async () => {
      graph.addFile('/test.md', 0);

      vi.spyOn(cache, 'getContent').mockResolvedValueOnce('Content');

      await outputter.output({ order: 'deps', basePath: '/' });

      // Should log progress message
      expect(logger.info).toHaveBeenCalledWith('Outputting 1 file(s)...');
      expect(logger.info).toHaveBeenCalledWith('✓ test.md');
    });
  });
});
