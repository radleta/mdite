import * as path from 'path';
import { DocGraph } from '../types/graph.js';
import { MarkdownCache } from './markdown-cache.js';
import { Logger } from '../utils/logger.js';

/**
 * Options for content output
 */
export interface OutputOptions {
  /** Ordering strategy: 'deps' (dependency order), 'alpha' (alphabetical) */
  order: 'deps' | 'alpha';

  /** Separator between files (default: "\n\n") */
  separator?: string;

  /** Output format: 'markdown' (raw content) or 'json' (structured data) */
  format?: 'markdown' | 'json';

  /** Base path for relative path calculation */
  basePath?: string;
}

/**
 * File metadata for JSON output
 */
export interface FileMetadata {
  file: string;
  depth: number;
  content: string;
  wordCount: number;
  lineCount: number;
}

/**
 * Content outputter for documentation system
 *
 * Outputs documentation content in various formats and orderings.
 * Supports streaming to stdout for pipe-friendly operation.
 *
 * @example
 * ```typescript
 * const outputter = new ContentOutputter(graph, cache, logger);
 *
 * // Output in dependency order
 * await outputter.output({
 *   order: 'deps',
 *   separator: '\n\n---\n\n'
 * });
 *
 * // Output as JSON
 * await outputter.output({
 *   order: 'alpha',
 *   format: 'json'
 * });
 * ```
 */
export class ContentOutputter {
  constructor(
    private graph: DocGraph,
    private cache: MarkdownCache,
    private logger: Logger
  ) {}

  /**
   * Output documentation content to stdout
   *
   * @param options - Output configuration options
   */
  async output(options: OutputOptions): Promise<void> {
    const files = this.getOrderedFiles(options);

    if (files.length === 0) {
      this.logger.info('No files to output');
      return;
    }

    this.logger.info(`Outputting ${files.length} file(s)...`);

    if (options.format === 'json') {
      await this.outputJSON(files, options);
    } else {
      await this.outputMarkdown(files, options);
    }
  }

  /**
   * Get files in the specified order
   *
   * @param options - Output options with order specification
   * @returns Array of file paths in the requested order
   */
  private getOrderedFiles(options: OutputOptions): string[] {
    switch (options.order) {
      case 'deps':
        return this.graph.getFilesInDependencyOrder();
      case 'alpha':
        return this.graph.getAllFiles().sort();
      default:
        return this.graph.getAllFiles();
    }
  }

  /**
   * Output files as raw markdown (default format)
   *
   * @param files - Files to output
   * @param options - Output options
   */
  private async outputMarkdown(files: string[], options: OutputOptions): Promise<void> {
    const separator = options.separator ?? '\n\n';
    const basePath: string = options.basePath ?? process.cwd();
    const fileCount = files.length;

    let index = 0;
    for (const file of files) {
      let content = await this.cache.getContent(file);
      const relativePath = path.relative(basePath, file);

      // Remove trailing newline from content (logger.log adds one)
      // Then add separator before the next file
      if (content.endsWith('\n')) {
        content = content.slice(0, -1);
      }

      // Add separator after content (except for last file)
      if (index < fileCount - 1) {
        content += separator;
      }

      // Output to stdout (data stream)
      // Note: logger.log adds a newline at the end
      this.logger.log(content);

      // Progress message to stderr
      this.logger.info(`✓ ${relativePath}`);

      index++;
    }
  }

  /**
   * Output files as JSON with metadata
   *
   * @param files - Files to output
   * @param options - Output options
   */
  private async outputJSON(files: string[], options: OutputOptions): Promise<void> {
    const basePath: string = options.basePath ?? process.cwd();
    const metadata: FileMetadata[] = [];

    for (const file of files) {
      const content = await this.cache.getContent(file);
      const relativePath = path.relative(basePath, file);
      const depth = this.graph.getDepth(file) ?? 0;

      // Calculate statistics
      const wordCount = this.countWords(content);
      const lineCount = this.countLines(content);

      metadata.push({
        file: relativePath,
        depth,
        content,
        wordCount,
        lineCount,
      });

      // Progress message to stderr
      this.logger.info(`✓ ${relativePath}`);
    }

    // Output JSON to stdout (data stream)
    this.logger.log(JSON.stringify(metadata, null, 2));
  }

  /**
   * Count words in text
   *
   * @param text - Text to count words in
   * @returns Number of words
   */
  private countWords(text: string): number {
    // Trim first to remove leading/trailing whitespace, then split and filter
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return 0;
    }
    return trimmed.split(/\s+/).length;
  }

  /**
   * Count lines in text
   *
   * @param text - Text to count lines in
   * @returns Number of lines
   */
  private countLines(text: string): number {
    return text.split('\n').length;
  }
}
