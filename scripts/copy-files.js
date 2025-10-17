#!/usr/bin/env node

/**
 * Copy necessary files after TypeScript compilation
 * This ensures any additional files are in the right place for distribution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure dist directory exists
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

/**
 * Recursively copy a directory with optional file filter
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 * @param {Function|null} filter - Optional filter function(filename) => boolean
 */
function copyDirRecursive(src, dest, filter = null) {
  let copiedCount = 0;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copiedCount += copyDirRecursive(srcPath, destPath, filter);
    } else {
      // Apply filter if provided
      if (filter && !filter(entry.name)) {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
      copiedCount++;
    }
  }

  return copiedCount;
}

/**
 * Copy a single file if it exists
 */
function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`Copied ${path.basename(src)} to ${path.relative(__dirname, dest)}`);
    return 1;
  }
  return 0;
}

let totalCopied = 0;

// Copy any future template files or assets
// Example: if you add templates/ directory in src/
const templatesSource = path.join(__dirname, '../src/templates');
const templatesDest = path.join(distDir, 'src/templates');

if (fs.existsSync(templatesSource)) {
  const copiedCount = copyDirRecursive(templatesSource, templatesDest, (filename) => {
    // Only copy .md or other non-TypeScript template files
    return filename.endsWith('.md') || filename.endsWith('.txt') || filename.endsWith('.json');
  });
  if (copiedCount > 0) {
    console.log(`Copied ${copiedCount} template files to dist/src/templates/`);
    totalCopied += copiedCount;
  }
}

// Copy default config files if they exist
const defaultConfigSource = path.join(__dirname, '../src/defaults');
const defaultConfigDest = path.join(distDir, 'src/defaults');

if (fs.existsSync(defaultConfigSource)) {
  const copiedCount = copyDirRecursive(defaultConfigSource, defaultConfigDest);
  if (copiedCount > 0) {
    console.log(`Copied ${copiedCount} default config files`);
    totalCopied += copiedCount;
  }
}

if (totalCopied === 0) {
  console.log('No additional files to copy (this is normal for current project structure)');
} else {
  console.log(`\n✓ Build files copied successfully (${totalCopied} files)`);
}
