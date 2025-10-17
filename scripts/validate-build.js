#!/usr/bin/env node

/**
 * Validate build output
 * Ensures critical files exist after build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredFiles = [
  'dist/src/index.js',
  'dist/src/cli.js',
  'dist/src/commands/lint.js',
  'dist/src/commands/init.js',
  'dist/src/commands/config.js',
  'dist/src/core/doc-linter.js',
  'dist/src/core/graph-analyzer.js',
  'dist/src/core/link-validator.js',
  'dist/src/core/config-manager.js',
];

let missingFiles = [];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error('❌ Build validation failed!');
  console.error('Missing files:');
  missingFiles.forEach(file => console.error(`  - ${file}`));
  process.exit(1);
}

console.log('✓ Build validation passed - all required files present');

// Check that index.js is executable (has shebang)
const indexPath = path.join(__dirname, '../dist/src/index.js');
const content = fs.readFileSync(indexPath, 'utf-8');
const firstLine = content.split('\n')[0];

if (!firstLine.startsWith('#!/usr/bin/env node')) {
  console.warn('⚠️  Warning: index.js missing shebang line');
}

// Check file sizes
const stats = fs.statSync(indexPath);
if (stats.size === 0) {
  console.error('❌ index.js is empty!');
  process.exit(1);
}

console.log(`\n✓ Build artifacts validated successfully`);
