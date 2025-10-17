import { afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, dirname } from 'path';

/**
 * Test directories created during tests
 * Will be cleaned up automatically after each test
 */
let testDirs: string[] = [];

/**
 * Create a temporary test directory
 * Automatically cleaned up after test
 * @param prefix - Prefix for the temp directory name
 * @returns Path to the created directory
 */
export async function createTestDir(prefix = 'doc-lint-test-'): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  testDirs.push(dir);
  return dir;
}

/**
 * Get the most recent test directory path (for convenience)
 * @returns Path to the last created test directory
 */
export function getTestDir(): string {
  return testDirs[testDirs.length - 1] || tmpdir();
}

/**
 * Write a test file with automatic directory creation
 * @param path - Full path to the file
 * @param content - File content
 */
export async function writeTestFile(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf-8');
}

/**
 * Create a test markdown file with frontmatter
 * @param path - Full path to the markdown file
 * @param options - Configuration options
 */
export async function writeTestMarkdown(
  path: string,
  options: {
    title?: string;
    frontmatter?: Record<string, unknown>;
    content?: string;
    links?: string[];
  }
): Promise<void> {
  const { title = 'Test Document', frontmatter, content = '', links = [] } = options;

  let markdown = '';

  // Add frontmatter if provided
  if (frontmatter) {
    markdown += '---\n';
    for (const [key, value] of Object.entries(frontmatter)) {
      markdown += `${key}: ${JSON.stringify(value)}\n`;
    }
    markdown += '---\n\n';
  }

  // Add title
  markdown += `# ${title}\n\n`;

  // Add content
  if (content) {
    markdown += content + '\n\n';
  }

  // Add links
  if (links.length > 0) {
    markdown += '## Links\n\n';
    for (const link of links) {
      markdown += `- [Link](${link})\n`;
    }
  }

  await writeTestFile(path, markdown);
}

/**
 * Create a test config file
 * @param path - Full path to the config file
 * @param config - Configuration object
 */
export async function writeTestConfig(
  path: string,
  config: Record<string, unknown>
): Promise<void> {
  await writeTestFile(path, JSON.stringify(config, null, 2));
}

/**
 * Helper to create a complete test documentation structure
 * @param baseDir - Base directory for the documentation
 * @param structure - Object mapping file paths to content
 */
export async function createTestDocs(
  baseDir: string,
  structure: Record<string, string | { content: string; links?: string[] }>
): Promise<void> {
  for (const [filePath, config] of Object.entries(structure)) {
    const fullPath = join(baseDir, filePath);

    if (typeof config === 'string') {
      await writeTestMarkdown(fullPath, { content: config });
    } else {
      await writeTestMarkdown(fullPath, {
        content: config.content,
        links: config.links,
      });
    }
  }
}

/**
 * Capture console output for testing
 */
export class ConsoleCapture {
  private originalLog: typeof console.log;
  private originalError: typeof console.error;
  private logs: string[] = [];
  private errors: string[] = [];

  constructor() {
    this.originalLog = console.log;
    this.originalError = console.error;
  }

  start(): void {
    this.logs = [];
    this.errors = [];

    console.log = (...args: unknown[]) => {
      this.logs.push(args.map(String).join(' '));
    };

    console.error = (...args: unknown[]) => {
      this.errors.push(args.map(String).join(' '));
    };
  }

  stop(): void {
    console.log = this.originalLog;
    console.error = this.originalError;
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  getOutput(): string {
    return this.logs.join('\n');
  }

  getErrorOutput(): string {
    return this.errors.join('\n');
  }

  clear(): void {
    this.logs = [];
    this.errors = [];
  }
}

/**
 * Cleanup hook - runs after each test
 */
afterEach(async () => {
  // Cleanup test directories
  await Promise.all(
    testDirs.map(dir =>
      rm(dir, { recursive: true, force: true }).catch(() => {
        // Ignore cleanup errors
      })
    )
  );
  testDirs = [];
});
