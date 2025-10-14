#!/usr/bin/env node

/**
 * Update CHANGELOG.md when npm version is run
 *
 * This script is called via npm's version lifecycle hook.
 * It updates the [Unreleased] section with the new version number and date.
 *
 * Usage (automatic via npm version):
 *   npm version patch  -> Updates CHANGELOG with new patch version
 *   npm version minor  -> Updates CHANGELOG with new minor version
 *   npm version major  -> Updates CHANGELOG with new major version
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const version = process.argv[2];
if (!version) {
  console.error('Error: Version argument required');
  console.error('Usage: node update-changelog.js <version>');
  process.exit(1);
}

const changelogPath = path.join(__dirname, '../CHANGELOG.md');

if (!fs.existsSync(changelogPath)) {
  console.error('Error: CHANGELOG.md not found');
  process.exit(1);
}

let changelog = fs.readFileSync(changelogPath, 'utf-8');

// Get current date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// Create version header
const versionHeader = `## [${version}] - ${today}`;

// Replace [Unreleased] with new version
const updatedChangelog = changelog.replace(
  /## \[Unreleased\]/,
  `## [Unreleased]\n\n${versionHeader}`
);

// Write updated changelog
fs.writeFileSync(changelogPath, updatedChangelog, 'utf-8');

console.log(`✓ Updated CHANGELOG.md for version ${version}`);
