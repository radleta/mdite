# File Structure

Complete file and directory layout for `doc-lint` v1, following the conventions established by `claude-iterate`.

---

## Project Root

```
doc-lint/
├── .github/                      # GitHub configuration
│   └── workflows/
│       └── ci.yml                # CI pipeline
├── .githooks/                    # Git hooks
│   └── pre-commit                # Block accidental commits
├── src/                          # Source code (see detailed breakdown below)
├── tests/                        # Test suites (see detailed breakdown below)
├── dist/                         # Build output (generated, gitignored)
├── .gitignore                    # Git ignore rules
├── .npmignore                    # npm ignore rules
├── .prettierrc                   # Prettier configuration
├── eslint.config.js              # ESLint configuration
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts              # Vitest configuration
├── package.json                  # Package manifest
├── package-lock.json             # Dependency lock file
├── README.md                     # User documentation
├── CHANGELOG.md                  # Version history
├── CONTRIBUTING.md               # Developer guide
├── LICENSE                       # MIT license
└── build.sh                      # Build script (optional)
```

---

## Source Structure (`src/`)

```
src/
├── index.ts                      # Entry point (executable)
├── cli.ts                        # CLI setup and command registration
│
├── commands/                     # Command implementations
│   ├── lint.ts                   # Main lint command
│   ├── init.ts                   # Initialize config file
│   └── config.ts                 # Config management command
│
├── core/                         # Core business logic
│   ├── doc-linter.ts             # Main orchestrator
│   ├── graph-analyzer.ts         # Dependency graph builder
│   ├── link-validator.ts         # Link validation
│   ├── remark-engine.ts          # Remark integration
│   ├── config-manager.ts         # Configuration loading
│   └── reporter.ts               # Result formatting and output
│
├── types/                        # TypeScript type definitions
│   ├── config.ts                 # Configuration types and schemas
│   ├── errors.ts                 # Error types and classes
│   ├── graph.ts                  # Graph data structures
│   └── results.ts                # Result types
│
└── utils/                        # Utility functions
    ├── logger.ts                 # Logging utility
    ├── errors.ts                 # Custom error classes
    ├── fs.ts                     # Filesystem utilities
    └── slug.ts                   # String slugification
```

---

## Detailed File Specifications

### 1. Entry Point and CLI Setup

#### `src/index.ts`
```typescript
#!/usr/bin/env node

import { cli } from './cli.js';

// Run CLI with top-level error handler
cli().catch((error: Error) => {
  console.error('Fatal error:', error.message);
  if (process.env['DEBUG']) {
    console.error(error.stack);
  }
  process.exit(1);
});
```

**Purpose:** Minimal entry point with error boundary

**Key Details:**
- Shebang for direct execution
- Top-level error handler
- DEBUG mode support
- Exit code 1 on error

---

#### `src/cli.ts`
```typescript
import { Command } from 'commander';
import { createRequire } from 'module';
import { lintCommand } from './commands/lint.js';
import { initCommand } from './commands/init.js';
import { configCommand } from './commands/config.js';

const require = createRequire(import.meta.url);
const { version: VERSION } = require('../package.json');

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

  // Register commands
  program.addCommand(lintCommand());
  program.addCommand(initCommand());
  program.addCommand(configCommand());

  await program.parseAsync(process.argv);
}
```

**Purpose:** Commander.js setup and command orchestration

**Key Details:**
- Version from package.json
- Global options available to all commands
- Command registration

---

### 2. Commands

#### `src/commands/lint.ts`
```typescript
import { Command } from 'commander';
import { DocLinter } from '../core/doc-linter.js';
import { ConfigManager } from '../core/config-manager.js';
import { Reporter } from '../core/reporter.js';
import { Logger } from '../utils/logger.js';

export function lintCommand(): Command {
  return new Command('lint')
    .description('Lint documentation files')
    .argument('[path]', 'Documentation directory', '.')
    .option('--fix', 'Auto-fix issues (not implemented in v1)')
    .option('--format <type>', 'Output format (text|json)', 'text')
    .action(async (path: string, options, command) => {
      const logger = new Logger(command.optsWithGlobals().colors !== false);

      try {
        logger.header('doc-lint');

        // Load configuration
        const configManager = new ConfigManager();
        const config = await configManager.load({
          ...command.optsWithGlobals(),
          basePath: path,
        });

        logger.info(`Linting: ${path}`);
        logger.info(`Entrypoint: ${config.entrypoint}`);
        logger.line();

        // Run linter
        const linter = new DocLinter(config, logger);
        const results = await linter.lint(path);

        // Report results
        const reporter = new Reporter(options.format, logger);
        reporter.report(results);

        // Exit with appropriate code
        process.exit(results.hasErrors() ? 1 : 0);
      } catch (error) {
        logger.error('Linting failed', error as Error);
        process.exit(1);
      }
    });
}
```

**Purpose:** Main linting command implementation

**Key Details:**
- Accepts path argument (defaults to current directory)
- Format option for output (text or JSON)
- Loads config, runs linter, reports results
- Exit code 1 if errors found

---

#### `src/commands/init.ts`
```typescript
import { Command } from 'commander';
import { Logger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const DEFAULT_CONFIG = `module.exports = {
  entrypoint: 'README.md',
  rules: {
    'orphan-files': 'error',
    'dead-link': 'error',
    'dead-anchor': 'error',
  },
};
`;

export function initCommand(): Command {
  return new Command('init')
    .description('Initialize doc-lint configuration file')
    .option('--config <path>', 'Config file path', 'doclint.config.js')
    .action(async (options, command) => {
      const logger = new Logger(command.optsWithGlobals().colors !== false);

      try {
        const configPath = path.resolve(options.config);

        // Check if config already exists
        if (await fs.access(configPath).then(() => true).catch(() => false)) {
          logger.error(`Configuration file already exists: ${configPath}`);
          process.exit(1);
        }

        // Write config
        await fs.writeFile(configPath, DEFAULT_CONFIG, 'utf-8');

        logger.success(`Created configuration file: ${configPath}`);
        logger.line();
        logger.info('Next steps:');
        logger.log('  1. Edit the configuration to match your project');
        logger.log('  2. Run: doc-lint lint');
      } catch (error) {
        logger.error('Failed to create configuration', error as Error);
        process.exit(1);
      }
    });
}
```

**Purpose:** Initialize configuration file

**Key Details:**
- Creates default config file
- Checks for existing config
- Provides next steps

---

#### `src/commands/config.ts`
```typescript
import { Command } from 'commander';
import { ConfigManager } from '../core/config-manager.js';
import { Logger } from '../utils/logger.js';

export function configCommand(): Command {
  return new Command('config')
    .description('Show current configuration')
    .action(async (options, command) => {
      const logger = new Logger(command.optsWithGlobals().colors !== false);

      try {
        const configManager = new ConfigManager();
        const config = await configManager.load(command.optsWithGlobals());

        logger.header('Current Configuration');
        logger.line();
        console.log(JSON.stringify(config, null, 2));
      } catch (error) {
        logger.error('Failed to load configuration', error as Error);
        process.exit(1);
      }
    });
}
```

**Purpose:** Display current configuration

**Key Details:**
- Shows resolved configuration
- Useful for debugging config issues

---

### 3. Core Logic

#### `src/core/doc-linter.ts`
```typescript
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

  async lint(basePath: string): Promise<LintResults> {
    this.logger.info('Building dependency graph...');

    // 1. Build graph
    const graphAnalyzer = new GraphAnalyzer(basePath, this.config);
    const graph = await graphAnalyzer.buildGraph();

    this.logger.success(`Found ${graph.getAllFiles().length} reachable files`);

    // 2. Check for orphans
    this.logger.info('Checking for orphaned files...');
    const orphans = await graphAnalyzer.findOrphans(graph);
    if (orphans.length > 0) {
      this.logger.error(`Found ${orphans.length} orphaned file(s)`);
    }

    // 3. Validate links
    this.logger.info('Validating links...');
    const linkValidator = new LinkValidator(basePath, graph);
    const linkErrors = await linkValidator.validate();
    if (linkErrors.length > 0) {
      this.logger.error(`Found ${linkErrors.length} link error(s)`);
    }

    // 4. Run remark
    this.logger.info('Running remark linter...');
    const remarkEngine = new RemarkEngine(this.config);
    const remarkErrors = [];

    for (const file of graph.getAllFiles()) {
      const fileErrors = await remarkEngine.processFile(file);
      remarkErrors.push(...fileErrors);
    }

    if (remarkErrors.length > 0) {
      this.logger.error(`Found ${remarkErrors.length} style error(s)`);
    }

    this.logger.line();

    // 5. Return results
    return new LintResults({
      orphans,
      linkErrors,
      remarkErrors,
    });
  }
}
```

**Purpose:** Orchestrate the entire linting process

**Key Details:**
- Coordinates all subsystems
- Provides progress feedback
- Aggregates results

---

#### `src/core/graph-analyzer.ts`
```typescript
import * as path from 'path';
import * as fs from 'fs/promises';
import { DocLintConfig } from '../types/config.js';
import { DocGraph } from '../types/graph.js';
import { findMarkdownFiles } from '../utils/fs.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

export class GraphAnalyzer {
  private graph: DocGraph;

  constructor(
    private basePath: string,
    private config: DocLintConfig
  ) {
    this.graph = new DocGraph();
  }

  async buildGraph(): Promise<DocGraph> {
    const entrypoint = path.join(this.basePath, this.config.entrypoint);
    await this.visitFile(entrypoint);
    return this.graph;
  }

  private async visitFile(filePath: string): Promise<void> {
    const normalized = path.resolve(filePath);

    if (this.graph.hasFile(normalized)) {
      return; // Already visited
    }

    // Check if file exists
    try {
      await fs.access(normalized);
    } catch {
      return; // File doesn't exist, skip
    }

    this.graph.addFile(normalized);

    // Extract links
    const content = await fs.readFile(normalized, 'utf-8');
    const links = await this.extractMarkdownLinks(content);

    // Follow relative markdown links
    for (const link of links) {
      const targetPath = path.resolve(path.dirname(normalized), link);
      this.graph.addEdge(normalized, targetPath);
      await this.visitFile(targetPath);
    }
  }

  private async extractMarkdownLinks(content: string): Promise<string[]> {
    const links: string[] = [];
    const processor = unified().use(remarkParse);
    const ast = processor.parse(content);

    visit(ast, 'link', (node: any) => {
      const url = node.url;
      // Only follow relative .md links
      if (!url.startsWith('http') && !url.startsWith('#')) {
        // Remove anchor if present
        const filePart = url.split('#')[0];
        if (filePart && filePart.endsWith('.md')) {
          links.push(filePart);
        }
      }
    });

    return links;
  }

  async findOrphans(graph: DocGraph): Promise<string[]> {
    const allFiles = await findMarkdownFiles(this.basePath);
    const reachableFiles = new Set(graph.getAllFiles());

    return allFiles.filter(file => !reachableFiles.has(path.resolve(file)));
  }
}
```

**Purpose:** Build dependency graph and find orphans

**Key Details:**
- Recursive graph traversal
- Uses remark to parse markdown and extract links
- Handles cycles (visited set)
- Finds orphaned files by comparing graph to filesystem

---

#### `src/core/link-validator.ts`
```typescript
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

    visit(ast, 'link', (node: any) => {
      const url = node.url;
      const position = node.position?.start || { line: 0, column: 0 };

      // Skip external links
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return;
      }

      // Check anchor-only links
      if (url.startsWith('#')) {
        const error = this.validateAnchor(url.slice(1), filePath, filePath, position);
        if (error) errors.push(error);
        return;
      }

      // Check file links
      const [filePart, anchor] = url.split('#');

      if (filePart) {
        const targetPath = path.resolve(path.dirname(filePath), filePart);
        const error = this.validateFileLink(targetPath, filePath, position);
        if (error) errors.push(error);

        // Check anchor in target file
        if (anchor && !error) {
          const anchorError = this.validateAnchor(anchor, targetPath, filePath, position);
          if (anchorError) errors.push(anchorError);
        }
      }
    });

    return errors;
  }

  private validateFileLink(
    targetPath: string,
    sourceFile: string,
    position: { line: number; column: number }
  ): LintError | null {
    try {
      fs.access(targetPath);
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
```

**Purpose:** Validate all links (files and anchors)

**Key Details:**
- Validates file existence
- Validates anchor existence
- Extracts headings and converts to slugs
- Reports errors with file/line/column

---

#### `src/core/remark-engine.ts`
```typescript
import { unified, Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkLint from 'remark-lint';
import { VFile } from 'vfile';
import * as fs from 'fs/promises';
import { DocLintConfig } from '../types/config.js';
import { LintError } from '../types/errors.js';

export class RemarkEngine {
  private processor: Processor;

  constructor(private config: DocLintConfig) {
    this.processor = this.createProcessor();
  }

  private createProcessor(): Processor {
    let processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkGfm)
      .use(remarkLint);

    // Add configured rules
    // (In v1, we'll support a basic set of remark-lint rules)

    return processor;
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
```

**Purpose:** Run remark-lint on files

**Key Details:**
- Creates unified processor pipeline
- Converts VFile messages to our error format
- Supports frontmatter and GFM

---

#### `src/core/config-manager.ts`
```typescript
import { cosmiconfig } from 'cosmiconfig';
import { DocLintConfig, DocLintConfigSchema, DEFAULT_CONFIG } from '../types/config.js';
import { InvalidConfigError } from '../utils/errors.js';

export class ConfigManager {
  async load(cliOptions: Record<string, unknown> = {}): Promise<DocLintConfig> {
    // 1. Search for config file
    const explorer = cosmiconfig('doclint');
    const result = await explorer.search();

    const fileConfig = result?.config || {};

    // 2. Merge: defaults < file < CLI
    const merged = {
      ...DEFAULT_CONFIG,
      ...fileConfig,
      ...cliOptions,
    };

    // 3. Validate with Zod
    try {
      return DocLintConfigSchema.parse(merged);
    } catch (error) {
      throw new InvalidConfigError(error.message);
    }
  }
}
```

**Purpose:** Load and validate configuration

**Key Details:**
- Uses cosmiconfig for file discovery
- Layered configuration merging
- Zod validation

---

#### `src/core/reporter.ts`
```typescript
import chalk from 'chalk';
import { LintResults } from '../types/results.js';
import { Logger } from '../utils/logger.js';

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

    // Group by file
    const byFile = new Map<string, typeof errors>();
    for (const error of errors) {
      if (!byFile.has(error.file)) {
        byFile.set(error.file, []);
      }
      byFile.get(error.file)!.push(error);
    }

    // Report each file
    for (const [file, fileErrors] of byFile) {
      console.log(chalk.underline(file));
      for (const error of fileErrors) {
        const location = error.line > 0 ? `${error.line}:${error.column}` : '-';
        const severity = error.severity === 'error'
          ? chalk.red('error')
          : chalk.yellow('warn');
        const rule = chalk.gray(`[${error.rule}]`);

        console.log(`  ${location} ${severity} ${error.message} ${rule}`);
      }
      console.log('');
    }

    // Summary
    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warnCount = errors.filter(e => e.severity === 'warning').length;

    this.logger.error(`${errorCount} error(s), ${warnCount} warning(s)`);
  }

  private reportJson(results: LintResults): void {
    console.log(JSON.stringify(results.getAllErrors(), null, 2));
  }
}
```

**Purpose:** Format and display results

**Key Details:**
- Text format with colors and grouping
- JSON format for CI/tooling integration
- Summary statistics

---

### 4. Types

#### `src/types/config.ts`
```typescript
import { z } from 'zod';

export const DocLintConfigSchema = z.object({
  entrypoint: z.string().default('README.md'),
  rules: z.record(z.enum(['error', 'warn', 'off'])).default({}),
  frontmatterSchema: z.any().optional(),
  extends: z.array(z.string()).optional(),
});

export type DocLintConfig = z.infer<typeof DocLintConfigSchema>;

export const DEFAULT_CONFIG: DocLintConfig = {
  entrypoint: 'README.md',
  rules: {
    'orphan-files': 'error',
    'dead-link': 'error',
    'dead-anchor': 'error',
  },
};
```

---

#### `src/types/errors.ts`
```typescript
export type RuleSeverity = 'error' | 'warning' | 'off';

export interface LintError {
  rule: string;
  severity: 'error' | 'warning';
  file: string;
  line: number;
  column: number;
  message: string;
}
```

---

#### `src/types/graph.ts`
```typescript
export interface DocNode {
  path: string;
}

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

---

#### `src/types/results.ts`
```typescript
import { LintError } from './errors.js';

export class LintResults {
  constructor(
    private data: {
      orphans: string[];
      linkErrors: LintError[];
      remarkErrors: LintError[];
    }
  ) {}

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
      rule: 'orphan-files',
      severity: 'error' as const,
      file,
      line: 0,
      column: 0,
      message: 'Orphaned file: not reachable from entrypoint',
    }));
  }
}
```

---

### 5. Utils

#### `src/utils/logger.ts`
```typescript
import chalk from 'chalk';

export class Logger {
  constructor(private colors: boolean = true) {}

  header(message: string): void {
    console.log('');
    console.log(this.colors ? chalk.bold(message) : message);
    console.log(this.colors ? chalk.gray('─'.repeat(50)) : '-'.repeat(50));
  }

  info(message: string): void {
    const icon = this.colors ? chalk.blue('ℹ') : 'i';
    console.log(`${icon} ${message}`);
  }

  success(message: string): void {
    const icon = this.colors ? chalk.green('✓') : '✓';
    console.log(`${icon} ${message}`);
  }

  error(message: string, error?: Error): void {
    const icon = this.colors ? chalk.red('✗') : '✗';
    console.error(`${icon} ${message}`);
    if (error && process.env['DEBUG']) {
      console.error(error.stack);
    }
  }

  log(message: string): void {
    console.log(message);
  }

  line(): void {
    console.log('');
  }
}
```

---

#### `src/utils/errors.ts`
```typescript
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

export class FileNotFoundError extends DocLintError {
  constructor(path: string) {
    super(`File not found: ${path}`);
    this.name = 'FileNotFoundError';
  }
}
```

---

#### `src/utils/fs.ts`
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

export async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
```

---

#### `src/utils/slug.ts`
```typescript
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

## Test Structure (`tests/`)

```
tests/
├── unit/                           # Unit tests
│   ├── graph-analyzer.test.ts      # Graph building and orphan detection
│   ├── link-validator.test.ts      # Link validation logic
│   ├── remark-engine.test.ts       # Remark integration
│   ├── config-manager.test.ts      # Config loading and merging
│   ├── reporter.test.ts            # Output formatting
│   └── utils/
│       ├── slug.test.ts            # Slug generation
│       └── fs.test.ts              # Filesystem utilities
│
├── integration/                    # Integration tests
│   ├── cli.test.ts                 # End-to-end CLI tests
│   ├── full-lint.test.ts           # Complete linting scenarios
│   └── config.test.ts              # Config discovery and merging
│
└── fixtures/                       # Test data
    ├── valid-docs/                 # Valid documentation
    │   ├── README.md
    │   ├── guide.md
    │   └── api.md
    ├── orphans/                    # Docs with orphans
    │   ├── README.md
    │   ├── linked.md
    │   └── orphan.md
    └── broken-links/               # Docs with broken links
        ├── README.md
        └── broken.md
```

---

## Configuration Files

### `package.json`
```json
{
  "name": "doc-lint",
  "version": "0.1.0",
  "description": "Project-level documentation linter",
  "type": "module",
  "main": "dist/src/index.js",
  "bin": {
    "doc-lint": "./dist/src/index.js"
  },
  "scripts": {
    "build": "tsc",
    "postbuild": "chmod +x dist/src/index.js",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src tests --ext .ts",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\" \"tests/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist",
    "prebuild": "npm run clean",
    "validate": "npm run lint && npm run typecheck && npm test"
  },
  "keywords": [
    "markdown",
    "documentation",
    "linter",
    "lint",
    "docs",
    "doc-lint"
  ],
  "author": "Your Name",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "chalk": "^5.4.1",
    "commander": "^12.1.0",
    "cosmiconfig": "^9.0.0",
    "remark": "^15.0.0",
    "remark-frontmatter": "^5.0.0",
    "remark-gfm": "^4.0.0",
    "remark-lint": "^10.0.0",
    "remark-parse": "^11.0.0",
    "unified": "^11.0.0",
    "unist-util-visit": "^5.0.0",
    "vfile": "^6.0.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "@typescript-eslint/eslint-plugin": "^8.20.0",
    "@typescript-eslint/parser": "^8.20.0",
    "@vitest/coverage-v8": "^2.1.8",
    "eslint": "^9.18.0",
    "prettier": "^3.4.2",
    "typescript": "^5.8.3",
    "vitest": "^2.1.8"
  },
  "files": [
    "dist/",
    "README.md",
    "LICENSE"
  ]
}
```

---

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": true,
    "newLine": "lf",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'dist/**',
        'tests/**',
        '**/*.test.ts',
        '**/types/**',
      ],
    },
  },
});
```

---

### `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

---

### `.gitignore`
```
node_modules/
dist/
coverage/
*.log
.DS_Store
.env
.vscode/
.idea/
```

---

### `.npmignore`
```
src/
tests/
coverage/
*.log
.vscode/
.idea/
tsconfig.json
vitest.config.ts
.prettierrc
eslint.config.js
.github/
.githooks/
```

---

## Summary

This structure provides:

- **Clear separation of concerns** - commands, core, types, utils
- **Type safety** - Comprehensive TypeScript types
- **Testing** - Unit and integration test suites
- **Modern tooling** - ESM, Vitest, ESLint, Prettier
- **Developer experience** - Scripts for all common tasks

Total file count: ~40 files (source + tests + config)

This follows the proven patterns from `claude-iterate` while adapting to the specific needs of a documentation linter.
