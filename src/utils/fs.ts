import * as fs from 'fs/promises';
import * as path from 'path';
import type { ExclusionManager } from '../core/exclusion-manager.js';

/**
 * Recursively find all markdown files in a directory
 *
 * Performs a depth-first traversal of the directory tree,
 * collecting all files with `.md` extension. Automatically skips:
 * - Hidden directories (starting with `.`)
 * - `node_modules` directory
 * - Files/directories matching exclusion patterns (if ExclusionManager provided)
 *
 * @param dir - Root directory to search (absolute path)
 * @param exclusionManager - Optional exclusion manager for filtering files
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
 * @example
 * ```typescript
 * import { findMarkdownFiles } from './fs.js';
 * import { ExclusionManager } from '../core/exclusion-manager.js';
 *
 * const exclusionManager = new ExclusionManager({
 *   basePath: './docs',
 *   configPatterns: ['drafts/**', '*.temp.md']
 * });
 *
 * const files = await findMarkdownFiles('./docs', exclusionManager);
 * console.log(`Found ${files.length} markdown files (after exclusions)`);
 * ```
 *
 * @remarks
 * This function follows symbolic links. Be cautious of circular
 * symlink references which may cause infinite loops.
 */
export async function findMarkdownFiles(
  dir: string,
  exclusionManager?: ExclusionManager
): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      // Check exclusion manager first if provided
      if (exclusionManager?.shouldExclude(fullPath)) {
        continue; // Skip excluded files/directories
      }

      if (entry.isDirectory()) {
        // Optimization: Check directory exclusion before descending
        if (exclusionManager?.shouldExcludeDirectory(fullPath)) {
          continue; // Skip entire directory
        }

        // Fallback to hardcoded exclusions if no exclusion manager
        if (!exclusionManager) {
          // Skip node_modules and hidden directories
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }
        }

        await walk(fullPath);
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
