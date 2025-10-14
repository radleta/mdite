# Architecture

## System Overview

`doc-lint` is architected as an **orchestrator** that coordinates multiple subsystems to provide both project-level graph validation and file-level content linting. It treats documentation not as isolated files, but as an interconnected project graph.

```
┌─────────────────────────────────────────────────────────────┐
│                      doc-lint CLI                           │
│                  (Commander.js Interface)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌───────────────┐  ┌──────────────┐
│   Config     │  │   Doc Graph   │  │    Remark    │
│   Manager    │  │   Analyzer    │  │   Engine     │
└──────────────┘  └───────────────┘  └──────────────┘
         │                 │                 │
         │        ┌────────┴────────┐        │
         │        │                 │        │
         ▼        ▼                 ▼        ▼
┌──────────────────────────────────────────────────┐
│           Error Reporter & Formatter             │
└──────────────────────────────────────────────────┘
```

---

## Core Modules

### 1. CLI Layer (`src/cli.ts`, `src/index.ts`)

**Responsibility:** User interface and command orchestration

**Following `claude-iterate` patterns:**
- `index.ts`: Minimal entry point with error boundary
- `cli.ts`: Commander.js setup, command registration, global options

**Key Functions:**
```typescript
// src/index.ts
#!/usr/bin/env node
import { cli } from './cli.js';

cli().catch((error: Error) => {
  console.error('Fatal error:', error.message);
  if (process.env['DEBUG']) {
    console.error(error.stack);
  }
  process.exit(1);
});
```

```typescript
// src/cli.ts
export async function cli() {
  const program = new Command();

  program
    .name('doc-lint')
    .description('Project-level documentation linter')
    .version(VERSION);

  // Global options
  program
    .option('--config <path>', 'Config file path')
    .option('--no-colors', 'Disable colored output')
    .option('--verbose', 'Verbose output');

  // Commands
  program.addCommand(lintCommand());
  program.addCommand(initCommand());
  program.addCommand(configCommand());

  await program.parseAsync(process.argv);
}
```

---

### 2. Commands Layer (`src/commands/`)

**Responsibility:** Individual command implementations

Following `claude-iterate`'s pattern, each command is a separate file that exports a function returning a `Command` instance:

```typescript
// src/commands/lint.ts
export function lintCommand(): Command {
  return new Command('lint')
    .description('Lint documentation files')
    .argument('[path]', 'Documentation directory', '.')
    .option('--fix', 'Auto-fix issues')
    .option('--format <type>', 'Output format (text|json)', 'text')
    .action(async (path: string, options, command) => {
      const logger = new Logger(command.optsWithGlobals().colors !== false);

      try {
        // Load config
        const configManager = new ConfigManager();
        const config = await configManager.load(command.optsWithGlobals());

        // Create linter
        const linter = new DocLinter(config, logger);

        // Run linting
        const results = await linter.lint(path);

        // Report results
        const reporter = new Reporter(options.format, logger);
        reporter.report(results);

        // Exit with error code if issues found
        process.exit(results.hasErrors() ? 1 : 0);
      } catch (error) {
        logger.error('Linting failed', error as Error);
        process.exit(1);
      }
    });
}
```

**Commands to implement:**
- `lint` - Main linting command
- `init` - Initialize config file
- `config` - Manage configuration

---

### 3. Core Layer (`src/core/`)

This is where the main business logic lives.

#### 3.1 DocLinter (`src/core/doc-linter.ts`)

**Responsibility:** Orchestrates the entire linting process

```typescript
export class DocLinter {
  constructor(
    private config: DocLintConfig,
    private logger: Logger
  ) {}

  async lint(basePath: string): Promise<LintResults> {
    this.logger.info('Starting documentation lint...');

    // 1. Build dependency graph
    const graphAnalyzer = new GraphAnalyzer(basePath, this.config);
    const graph = await graphAnalyzer.buildGraph();

    // 2. Check for orphans
    const orphans = await graphAnalyzer.findOrphans(graph);

    // 3. Validate links
    const linkValidator = new LinkValidator(basePath, graph);
    const linkErrors = await linkValidator.validate();

    // 4. Run remark on each file
    const remarkEngine = new RemarkEngine(this.config);
    const remarkErrors: LintError[] = [];

    for (const file of graph.getAllFiles()) {
      const fileErrors = await remarkEngine.processFile(file);
      remarkErrors.push(...fileErrors);
    }

    // 5. Aggregate results
    return new LintResults({
      orphans,
      linkErrors,
      remarkErrors,
    });
  }
}
```

#### 3.2 GraphAnalyzer (`src/core/graph-analyzer.ts`)

**Responsibility:** Build and analyze the document dependency graph

```typescript
export class GraphAnalyzer {
  private graph: DocGraph;

  constructor(
    private basePath: string,
    private config: DocLintConfig
  ) {
    this.graph = new DocGraph();
  }

  /**
   * Build graph by traversing from entrypoint
   */
  async buildGraph(): Promise<DocGraph> {
    const entrypoint = path.join(this.basePath, this.config.entrypoint);

    // Recursive traversal
    await this.visitFile(entrypoint);

    return this.graph;
  }

  private async visitFile(filePath: string): Promise<void> {
    if (this.graph.hasFile(filePath)) {
      return; // Already visited
    }

    this.graph.addFile(filePath);

    // Parse file to extract links
    const content = await fs.readFile(filePath, 'utf-8');
    const links = this.extractMarkdownLinks(content);

    // Follow relative markdown links
    for (const link of links) {
      if (this.isRelativeMarkdownLink(link)) {
        const targetPath = path.resolve(path.dirname(filePath), link);
        this.graph.addEdge(filePath, targetPath);
        await this.visitFile(targetPath);
      }
    }
  }

  /**
   * Find orphaned files
   */
  async findOrphans(graph: DocGraph): Promise<string[]> {
    // Get all .md files in directory
    const allFiles = await this.findAllMarkdownFiles(this.basePath);

    // Find files not in graph
    const reachableFiles = new Set(graph.getAllFiles());
    const orphans = allFiles.filter(file => !reachableFiles.has(file));

    return orphans;
  }

  private extractMarkdownLinks(content: string): string[] {
    // Parse markdown and extract links
    // This will use remark-parse internally
  }
}
```

**Graph Data Structure:**
```typescript
export class DocGraph {
  private nodes = new Map<string, DocNode>();
  private edges = new Map<string, Set<string>>();

  addFile(filePath: string): void {
    this.nodes.set(filePath, { path: filePath });
  }

  addEdge(from: string, to: string): void {
    if (!this.edges.has(from)) {
      this.edges.set(from, new Set());
    }
    this.edges.get(from)!.add(to);
  }

  hasFile(filePath: string): boolean {
    return this.nodes.has(filePath);
  }

  getAllFiles(): string[] {
    return Array.from(this.nodes.keys());
  }

  getOutgoingLinks(filePath: string): string[] {
    return Array.from(this.edges.get(filePath) || []);
  }
}
```

#### 3.3 LinkValidator (`src/core/link-validator.ts`)

**Responsibility:** Validate all links (files and anchors)

```typescript
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

    // Parse with remark to get link nodes with positions
    const ast = await this.parseMarkdown(content);

    // Visit all link nodes
    visit(ast, 'link', (node: Link) => {
      const { url } = node;
      const { line, column } = node.position.start;

      // Validate relative file links
      if (this.isRelativeFileLink(url)) {
        const targetPath = path.resolve(path.dirname(filePath), url);
        if (!fs.existsSync(targetPath)) {
          errors.push({
            rule: 'dead-link',
            severity: 'error',
            file: filePath,
            line,
            column,
            message: `Dead link: ${url}`,
          });
        }
      }

      // Validate anchor links
      if (url.includes('#')) {
        const anchorError = this.validateAnchor(url, filePath, line, column);
        if (anchorError) {
          errors.push(anchorError);
        }
      }
    });

    return errors;
  }

  private validateAnchor(
    url: string,
    sourceFile: string,
    line: number,
    column: number
  ): LintError | null {
    const [filePart, anchor] = url.split('#');
    const targetFile = filePart
      ? path.resolve(path.dirname(sourceFile), filePart)
      : sourceFile;

    // Check if anchor exists in target file
    const headings = this.extractHeadings(targetFile);
    const anchorSlug = this.slugify(anchor);

    if (!headings.includes(anchorSlug)) {
      return {
        rule: 'dead-anchor',
        severity: 'error',
        file: sourceFile,
        line,
        column,
        message: `Dead anchor: #${anchor} in ${targetFile}`,
      };
    }

    return null;
  }
}
```

#### 3.4 RemarkEngine (`src/core/remark-engine.ts`)

**Responsibility:** Run remark-lint and custom rules on each file

```typescript
export class RemarkEngine {
  private processor: Processor;

  constructor(private config: DocLintConfig) {
    this.processor = this.createProcessor();
  }

  private createProcessor(): Processor {
    const processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkGfm);

    // Add configured lint rules
    for (const [rule, severity] of Object.entries(this.config.rules)) {
      if (severity !== 'off') {
        const remarkRule = this.loadRemarkRule(rule);
        processor.use(remarkRule, [severity]);
      }
    }

    // Add our custom rules
    processor.use(remarkLintFrontmatterSchema, {
      schema: this.config.frontmatterSchema,
    });

    return processor;
  }

  async processFile(filePath: string): Promise<LintError[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const vfile = new VFile({ path: filePath, value: content });

    try {
      await this.processor.process(vfile);
    } catch (error) {
      // Processor errors
    }

    // Convert VFile messages to our error format
    return vfile.messages.map(msg => ({
      rule: msg.ruleId || 'unknown',
      severity: msg.fatal ? 'error' : 'warning',
      file: filePath,
      line: msg.line || 0,
      column: msg.column || 0,
      message: msg.message,
    }));
  }
}
```

#### 3.5 ConfigManager (`src/core/config-manager.ts`)

**Responsibility:** Load and merge configuration

Following `claude-iterate`'s layered config approach:

```typescript
export class ConfigManager {
  async load(cliOptions: Record<string, unknown>): Promise<DocLintConfig> {
    // 1. Load from file (cosmiconfig)
    const explorer = cosmiconfig('doclint');
    const result = await explorer.search();
    const fileConfig = result?.config || {};

    // 2. Merge with defaults
    const config = {
      ...DEFAULT_CONFIG,
      ...fileConfig,
      ...cliOptions,
    };

    // 3. Validate with Zod
    return DocLintConfigSchema.parse(config);
  }
}
```

---

### 4. Types Layer (`src/types/`)

Type definitions for the entire system:

```typescript
// src/types/config.ts
export interface DocLintConfig {
  entrypoint: string;
  rules: Record<string, RuleSeverity>;
  frontmatterSchema?: JSONSchema;
  extends?: string[];
}

export const DocLintConfigSchema = z.object({
  entrypoint: z.string().default('README.md'),
  rules: z.record(z.enum(['error', 'warn', 'off'])),
  frontmatterSchema: z.any().optional(),
  extends: z.array(z.string()).optional(),
});

// src/types/errors.ts
export interface LintError {
  rule: string;
  severity: 'error' | 'warning';
  file: string;
  line: number;
  column: number;
  message: string;
}

export class LintResults {
  constructor(private data: {
    orphans: string[];
    linkErrors: LintError[];
    remarkErrors: LintError[];
  }) {}

  hasErrors(): boolean {
    return this.getAllErrors().some(e => e.severity === 'error');
  }

  getAllErrors(): LintError[] {
    return [
      ...this.orphanErrors(),
      ...this.data.linkErrors,
      ...this.data.remarkErrors,
    ];
  }

  private orphanErrors(): LintError[] {
    return this.data.orphans.map(file => ({
      rule: 'orphan-file',
      severity: 'error' as const,
      file,
      line: 0,
      column: 0,
      message: `Orphaned file: not reachable from ${this.entrypoint}`,
    }));
  }
}

// src/types/graph.ts
export interface DocNode {
  path: string;
}
```

---

### 5. Utils Layer (`src/utils/`)

Utility functions following `claude-iterate` patterns:

```typescript
// src/utils/logger.ts
export class Logger {
  constructor(private colors: boolean = true) {}

  info(message: string): void {
    console.log(this.colors ? chalk.blue('ℹ') : 'i', message);
  }

  success(message: string): void {
    console.log(this.colors ? chalk.green('✓') : '✓', message);
  }

  error(message: string, error?: Error): void {
    console.error(this.colors ? chalk.red('✗') : '✗', message);
    if (error && process.env['DEBUG']) {
      console.error(error.stack);
    }
  }

  header(message: string): void {
    console.log('');
    console.log(this.colors ? chalk.bold(message) : message);
    console.log(this.colors ? chalk.gray('─'.repeat(50)) : '-'.repeat(50));
  }

  line(): void {
    console.log('');
  }
}

// src/utils/errors.ts
export class DocLintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocLintError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ConfigNotFoundError extends DocLintError {
  constructor() {
    super('Configuration file not found');
    this.name = 'ConfigNotFoundError';
  }
}

export class InvalidConfigError extends DocLintError {
  constructor(message: string) {
    super(`Invalid configuration: ${message}`);
    this.name = 'InvalidConfigError';
  }
}

// src/utils/fs.ts
export async function findMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

// src/utils/slug.ts
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

---

### 6. Reporter (`src/core/reporter.ts`)

**Responsibility:** Format and output lint results

```typescript
export class Reporter {
  constructor(
    private format: 'text' | 'json',
    private logger: Logger
  ) {}

  report(results: LintResults): void {
    if (this.format === 'json') {
      this.reportJson(results);
    } else {
      this.reportText(results);
    }
  }

  private reportText(results: LintResults): void {
    const errors = results.getAllErrors();

    if (errors.length === 0) {
      this.logger.success('No issues found!');
      return;
    }

    this.logger.header(`Found ${errors.length} issue(s)`);
    this.logger.line();

    for (const error of errors) {
      const location = error.line > 0
        ? `${error.file}:${error.line}:${error.column}`
        : error.file;

      const severity = error.severity === 'error'
        ? chalk.red('error')
        : chalk.yellow('warning');

      const rule = chalk.gray(`[${error.rule}]`);

      console.log(`${location} ${severity} ${error.message} ${rule}`);
    }

    this.logger.line();

    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warnCount = errors.filter(e => e.severity === 'warning').length;

    this.logger.error(
      `${errorCount} error(s), ${warnCount} warning(s)`
    );
  }

  private reportJson(results: LintResults): void {
    console.log(JSON.stringify(results.getAllErrors(), null, 2));
  }
}
```

---

## Data Flow

```
1. CLI invoked
   ↓
2. Load configuration (cosmiconfig)
   ↓
3. Create DocLinter instance
   ↓
4. Build dependency graph
   - Start from entrypoint
   - Recursively follow links
   - Track all reachable files
   ↓
5. Find orphans
   - Scan filesystem for all .md files
   - Compare with graph
   ↓
6. Validate links
   - Check file existence
   - Check anchor existence
   ↓
7. Run remark on each file
   - Apply lint rules
   - Validate frontmatter
   ↓
8. Aggregate results
   ↓
9. Format and report
   ↓
10. Exit with appropriate code
```

---

## Error Handling Strategy

Following `claude-iterate`'s approach:

1. **Custom Error Classes** - Specific errors for different failure modes
2. **Top-Level Catch** - CLI entry point catches and formats all errors
3. **Exit Codes** - 0 for success, 1 for errors
4. **Debug Mode** - Stack traces available via `DEBUG` env var
5. **Graceful Degradation** - Continue processing even if one file fails

---

## Testing Strategy

Following `claude-iterate`'s comprehensive testing:

```
tests/
├── unit/                    # Unit tests for individual modules
│   ├── graph-analyzer.test.ts
│   ├── link-validator.test.ts
│   ├── remark-engine.test.ts
│   └── config-manager.test.ts
├── integration/            # End-to-end scenarios
│   ├── cli.test.ts
│   └── real-docs.test.ts
└── fixtures/               # Test data
    └── sample-docs/
        ├── README.md
        ├── guide.md
        └── orphan.md
```

**Test Patterns:**
- Use Vitest for all tests
- Mock filesystem with in-memory structures
- Test fixtures for real markdown scenarios
- Coverage target: 80%+

---

## Extension Points

Design for future extensibility:

1. **Custom Rules** - Plugin architecture for user-defined rules
2. **Formatters** - Additional output formats (HTML, SARIF)
3. **Link Checkers** - External link validation
4. **Fixers** - Auto-fix implementations
5. **Caching** - Performance optimization layer
