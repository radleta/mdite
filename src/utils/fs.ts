import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Recursively find all markdown files in a directory
 *
 * Performs a depth-first traversal of the directory tree,
 * collecting all files with `.md` extension. Automatically skips:
 * - Hidden directories (starting with `.`)
 * - `node_modules` directory
 *
 * @param dir - Root directory to search (absolute path)
 * @returns Array of absolute paths to markdown files
 * @throws {DirectoryNotFoundError} If directory doesn't exist
 *
 * @example
 * ```typescript
 * import { findMarkdownFiles } from './fs.js';
 *
 * const files = await findMarkdownFiles('./docs');
 * console.log(`Found ${files.length} markdown files`);
 * ```
 *
 * @remarks
 * This function follows symbolic links. Be cautious of circular
 * symlink references which may cause infinite loops.
 */
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

/**
 * Check if a file exists and is accessible
 *
 * Uses fs.access() to check file existence without reading the file.
 * This is more efficient than trying to read the file.
 *
 * @param filePath - Path to the file (absolute or relative)
 * @returns True if file exists and is readable, false otherwise
 *
 * @example
 * ```typescript
 * import { fileExists } from './fs.js';
 *
 * if (await fileExists('./README.md')) {
 *   console.log('README found');
 * } else {
 *   console.log('README missing');
 * }
 * ```
 *
 * @remarks
 * Returns false for any error (not found, permission denied, etc.)
 * Does not distinguish between different types of access failures
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
