import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkLint from 'remark-lint';
import { VFile } from 'vfile';
import * as fs from 'fs/promises';
import { DocLintConfig } from '../types/config.js';
import { LintError } from '../types/errors.js';

export class RemarkEngine {
  private processor: ReturnType<typeof this.createProcessor>;

  constructor(_config: DocLintConfig) {
    this.processor = this.createProcessor();
  }

  private createProcessor() {
    return unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkGfm)
      .use(remarkLint);

    // Add configured rules
    // (In v1, we'll support a basic set of remark-lint rules)
  }

  async processFile(filePath: string): Promise<LintError[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const vfile = new VFile({ path: filePath, value: content });

    try {
      await this.processor.process(vfile);
    } catch (error) {
      // Processor errors are already in vfile.messages
    }

    // Convert VFile messages to our error format
    return vfile.messages.map(msg => ({
      rule: msg.ruleId || 'remark',
      severity: msg.fatal ? 'error' : 'warning',
      file: filePath,
      line: msg.line || 0,
      column: msg.column || 0,
      message: msg.message,
    }));
  }
}
