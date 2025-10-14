import * as path from 'path';
import * as fs from 'fs/promises';
import { DocGraph } from '../types/graph.js';
import { LintError } from '../types/errors.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import { slugify } from '../utils/slug.js';

export class LinkValidator {
  constructor(
    private basePath: string,
    private graph: DocGraph
  ) {}

  async validate(): Promise<LintError[]> {
    const errors: LintError[] = [];

    for (const file of this.graph.getAllFiles()) {
      const fileErrors = await this.validateFile(file);
      errors.push(...fileErrors);
    }

    return errors;
  }

  private async validateFile(filePath: string): Promise<LintError[]> {
    const errors: LintError[] = [];
    const content = await fs.readFile(filePath, 'utf-8');

    const processor = unified().use(remarkParse);
    const ast = processor.parse(content);

    const linkChecks: Promise<LintError | null>[] = [];

    visit(ast, 'link', (node: any) => {
      const url = node.url;
      const position = node.position?.start || { line: 0, column: 0 };

      // Skip external links
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return;
      }

      // Check anchor-only links
      if (url.startsWith('#')) {
        linkChecks.push(this.validateAnchor(url.slice(1), filePath, filePath, position));
        return;
      }

      // Check file links
      const [filePart, anchor] = url.split('#');

      if (filePart) {
        const targetPath = path.resolve(path.dirname(filePath), filePart);

        linkChecks.push(
          this.validateFileLink(targetPath, filePath, position).then(error => {
            // If file link is valid and there's an anchor, check it
            if (!error && anchor) {
              return this.validateAnchor(anchor, targetPath, filePath, position);
            }
            return error;
          })
        );
      }
    });

    // Wait for all async validations
    const results = await Promise.all(linkChecks);
    errors.push(...results.filter((e): e is LintError => e !== null));

    return errors;
  }

  private async validateFileLink(
    targetPath: string,
    sourceFile: string,
    position: { line: number; column: number }
  ): Promise<LintError | null> {
    try {
      await fs.access(targetPath);
      return null;
    } catch {
      return {
        rule: 'dead-link',
        severity: 'error',
        file: sourceFile,
        line: position.line,
        column: position.column,
        message: `Dead link: ${path.relative(this.basePath, targetPath)}`,
      };
    }
  }

  private async validateAnchor(
    anchor: string,
    targetFile: string,
    sourceFile: string,
    position: { line: number; column: number }
  ): Promise<LintError | null> {
    try {
      const headings = await this.extractHeadings(targetFile);
      const anchorSlug = slugify(anchor);

      if (!headings.includes(anchorSlug)) {
        return {
          rule: 'dead-anchor',
          severity: 'error',
          file: sourceFile,
          line: position.line,
          column: position.column,
          message: `Dead anchor: #${anchor} in ${path.relative(this.basePath, targetFile)}`,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private async extractHeadings(filePath: string): Promise<string[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const processor = unified().use(remarkParse);
    const ast = processor.parse(content);

    const headings: string[] = [];
    visit(ast, 'heading', (node: any) => {
      // Extract text from heading
      const text = node.children
        .filter((child: any) => child.type === 'text')
        .map((child: any) => child.value)
        .join('');
      headings.push(slugify(text));
    });

    return headings;
  }
}
