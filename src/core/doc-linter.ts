import { DocLintConfig } from '../types/config.js';
import { LintResults } from '../types/results.js';
import { Logger } from '../utils/logger.js';
import { GraphAnalyzer } from './graph-analyzer.js';
import { LinkValidator } from './link-validator.js';
import { RemarkEngine } from './remark-engine.js';

export class DocLinter {
  constructor(
    private config: DocLintConfig,
    private logger: Logger
  ) {}

  async lint(basePath: string, quiet = false): Promise<LintResults> {
    if (!quiet) this.logger.info('Building dependency graph...');

    // 1. Build graph
    const graphAnalyzer = new GraphAnalyzer(basePath, this.config);
    const graph = await graphAnalyzer.buildGraph();

    if (!quiet) this.logger.success(`Found ${graph.getAllFiles().length} reachable files`);

    // 2. Check for orphans
    if (!quiet) this.logger.info('Checking for orphaned files...');
    const orphans = await graphAnalyzer.findOrphans(graph);
    if (!quiet) {
      if (orphans.length > 0) {
        this.logger.error(`Found ${orphans.length} orphaned file(s)`);
      } else {
        this.logger.success('No orphaned files');
      }
    }

    // 3. Validate links
    if (!quiet) this.logger.info('Validating links...');
    const linkValidator = new LinkValidator(basePath, graph);
    const linkErrors = await linkValidator.validate();
    if (!quiet) {
      if (linkErrors.length > 0) {
        this.logger.error(`Found ${linkErrors.length} link error(s)`);
      } else {
        this.logger.success('All links valid');
      }
    }

    // 4. Run remark
    if (!quiet) this.logger.info('Running remark linter...');
    const remarkEngine = new RemarkEngine(this.config);
    const remarkErrors = [];

    for (const file of graph.getAllFiles()) {
      const fileErrors = await remarkEngine.processFile(file);
      remarkErrors.push(...fileErrors);
    }

    if (!quiet) {
      if (remarkErrors.length > 0) {
        this.logger.error(`Found ${remarkErrors.length} style error(s)`);
      } else {
        this.logger.success('No style errors');
      }
    }

    if (!quiet) this.logger.line();

    // 5. Return results
    return new LintResults({
      orphans,
      linkErrors,
      remarkErrors,
    });
  }
}
