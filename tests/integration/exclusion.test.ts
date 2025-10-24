import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDir, writeTestFile } from '../setup.js';
import { join } from 'path';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('file exclusion (integration)', () => {
  let testDir: string;
  let cliPath: string;

  beforeEach(async () => {
    testDir = await createTestDir();
    cliPath = path.resolve(process.cwd(), 'dist/src/index.js');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  function runCli(args: string[]): {
    stdout: string;
    stderr: string;
    exitCode: number;
  } {
    const { spawnSync } = require('child_process');
    const result = spawnSync('node', [cliPath, ...args], {
      cwd: testDir,
      encoding: 'utf-8',
    });

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.status || 0,
    };
  }

  describe('CLI exclusion (--exclude)', () => {
    it('should exclude files matching CLI patterns', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Guide](./guide.md)');
      await writeTestFile(join(testDir, 'guide.md'), '# Guide');
      await writeTestFile(join(testDir, 'draft.md'), '# Draft');
      await writeTestFile(join(testDir, 'temp.md'), '# Temp');

      const result = runCli(['lint', '--exclude', 'draft.md', '--exclude', 'temp.md']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('draft.md');
      expect(result.stdout).not.toContain('temp.md');
      expect(result.stderr).toContain('No issues found');
    });

    it('should exclude directories with wildcard patterns', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await fs.mkdir(join(testDir, 'drafts'), { recursive: true });
      await writeTestFile(join(testDir, 'drafts/wip.md'), '# WIP');
      await writeTestFile(join(testDir, 'drafts/notes.md'), '# Notes');

      const result = runCli(['lint', '--exclude', 'drafts/**']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('drafts/wip.md');
      expect(result.stdout).not.toContain('drafts/notes.md');
      expect(result.stderr).toContain('No issues found');
    });

    it('should exclude files with glob patterns', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'api.draft.md'), '# Draft API');
      await writeTestFile(join(testDir, 'guide.draft.md'), '# Draft Guide');
      await writeTestFile(join(testDir, 'published.md'), '# Published');

      const result = runCli(['lint', '--exclude', '*.draft.md']);

      // published.md is still an orphan, so exit code should be 1
      expect(result.exitCode).toBe(1);
      expect(result.stdout).not.toContain('api.draft.md');
      expect(result.stdout).not.toContain('guide.draft.md');
      // published.md should still be an orphan
      expect(result.stdout).toContain('published.md');
      expect(result.stdout).toContain('Orphaned file');
    });

    it('should support multiple --exclude patterns', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await fs.mkdir(join(testDir, 'drafts'), { recursive: true });
      await fs.mkdir(join(testDir, 'temp'), { recursive: true });
      await writeTestFile(join(testDir, 'drafts/wip.md'), '# WIP');
      await writeTestFile(join(testDir, 'temp/notes.md'), '# Notes');
      await writeTestFile(join(testDir, 'api.draft.md'), '# Draft');

      const result = runCli([
        'lint',
        '--exclude',
        'drafts/**',
        '--exclude',
        'temp/**',
        '--exclude',
        '*.draft.md',
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('drafts/wip.md');
      expect(result.stdout).not.toContain('temp/notes.md');
      expect(result.stdout).not.toContain('api.draft.md');
      expect(result.stderr).toContain('No issues found');
    });
  });

  describe('Config file exclusion', () => {
    it('should exclude files specified in config', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'draft.md'), '# Draft');
      await writeTestFile(
        join(testDir, 'mdite.config.js'),
        `module.exports = { exclude: ['draft.md'] };`
      );

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('draft.md');
      expect(result.stderr).toContain('No issues found');
    });

    it('should exclude directories specified in config', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await fs.mkdir(join(testDir, 'drafts'), { recursive: true });
      await writeTestFile(join(testDir, 'drafts/wip.md'), '# WIP');
      await writeTestFile(
        join(testDir, 'mdite.config.js'),
        `module.exports = { exclude: ['drafts/**'] };`
      );

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('drafts/wip.md');
      expect(result.stderr).toContain('No issues found');
    });

    it('should support array of patterns in config', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await fs.mkdir(join(testDir, 'drafts'), { recursive: true });
      await writeTestFile(join(testDir, 'drafts/wip.md'), '# WIP');
      await writeTestFile(join(testDir, 'api.draft.md'), '# Draft API');
      await writeTestFile(
        join(testDir, 'mdite.config.js'),
        `module.exports = { exclude: ['drafts/**', '*.draft.md'] };`
      );

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('drafts/wip.md');
      expect(result.stdout).not.toContain('api.draft.md');
      expect(result.stderr).toContain('No issues found');
    });
  });

  describe('.mditeignore file', () => {
    it('should exclude files matching .mditeignore patterns', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'draft.md'), '# Draft');
      await writeTestFile(join(testDir, '.mditeignore'), 'draft.md');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('draft.md');
      expect(result.stderr).toContain('No issues found');
    });

    it('should support gitignore-style patterns in .mditeignore', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await fs.mkdir(join(testDir, 'drafts'), { recursive: true });
      await writeTestFile(join(testDir, 'drafts/wip.md'), '# WIP');
      await writeTestFile(join(testDir, 'api.draft.md'), '# Draft API');
      await writeTestFile(join(testDir, '.mditeignore'), 'drafts/\n*.draft.md');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('drafts/wip.md');
      expect(result.stdout).not.toContain('api.draft.md');
      expect(result.stderr).toContain('No issues found');
    });

    it('should ignore comments in .mditeignore', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'draft.md'), '# Draft');
      await writeTestFile(
        join(testDir, '.mditeignore'),
        '# This is a comment\ndraft.md\n# Another comment'
      );

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('draft.md');
      expect(result.stderr).toContain('No issues found');
    });

    it('should handle empty .mditeignore file', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');
      await writeTestFile(join(testDir, '.mditeignore'), '');

      const result = runCli(['lint']);

      // orphan.md should still be detected as orphan
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('orphan.md');
      expect(result.stdout).toContain('Orphaned file');
    });
  });

  describe('--respect-gitignore flag', () => {
    it('should exclude files matching .gitignore when flag is set', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'draft.md'), '# Draft');
      await writeTestFile(join(testDir, '.gitignore'), 'draft.md');

      const result = runCli(['lint', '--respect-gitignore']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('draft.md');
      expect(result.stderr).toContain('No issues found');
    });

    it('should NOT exclude .gitignore files by default', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'draft.md'), '# Draft');
      await writeTestFile(join(testDir, '.gitignore'), 'draft.md');

      const result = runCli(['lint']);

      // draft.md should be detected as orphan (gitignore not respected by default)
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('draft.md');
      expect(result.stdout).toContain('Orphaned file');
    });

    it('should respect .gitignore patterns with --respect-gitignore', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await fs.mkdir(join(testDir, 'dist'), { recursive: true });
      await writeTestFile(join(testDir, 'dist/output.md'), '# Output');
      await writeTestFile(join(testDir, '.gitignore'), 'dist/');

      const result = runCli(['lint', '--respect-gitignore']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('dist/output.md');
      expect(result.stderr).toContain('No issues found');
    });
  });

  describe('negation patterns', () => {
    it('should re-include files using negation patterns', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Important](./important.draft.md)'
      );
      await writeTestFile(join(testDir, 'api.draft.md'), '# Draft API');
      await writeTestFile(join(testDir, 'important.draft.md'), '# Important Draft');
      await writeTestFile(join(testDir, '.mditeignore'), '*.draft.md\n!important.draft.md');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      // important.draft.md should be included (negation)
      expect(result.stdout).not.toContain('important.draft.md');
      // api.draft.md should be excluded
      expect(result.stdout).not.toContain('api.draft.md');
      expect(result.stderr).toContain('No issues found');
    });

    it('should support negation patterns in config', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Keep](./drafts/keep.md)');
      await fs.mkdir(join(testDir, 'drafts'), { recursive: true });
      await writeTestFile(join(testDir, 'drafts/wip.md'), '# WIP');
      await writeTestFile(join(testDir, 'drafts/keep.md'), '# Keep');
      await writeTestFile(
        join(testDir, 'mdite.config.js'),
        `module.exports = { exclude: ['drafts/**', '!drafts/keep.md'] };`
      );

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      // drafts/keep.md should be included (negation)
      expect(result.stdout).not.toContain('drafts/keep.md');
      // drafts/wip.md should be excluded
      expect(result.stdout).not.toContain('drafts/wip.md');
      expect(result.stderr).toContain('No issues found');
    });
  });

  describe('combined exclusion sources', () => {
    it('should merge patterns from CLI, config, and .mditeignore', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'draft.md'), '# Draft (mditeignore)');
      await writeTestFile(join(testDir, 'temp.md'), '# Temp (config)');
      await writeTestFile(join(testDir, 'scratch.md'), '# Scratch (CLI)');
      await writeTestFile(join(testDir, '.mditeignore'), 'draft.md');
      await writeTestFile(
        join(testDir, 'mdite.config.js'),
        `module.exports = { exclude: ['temp.md'] };`
      );

      const result = runCli(['lint', '--exclude', 'scratch.md']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('draft.md');
      expect(result.stdout).not.toContain('temp.md');
      expect(result.stdout).not.toContain('scratch.md');
      expect(result.stderr).toContain('No issues found');
    });

    it('should handle CLI + .gitignore + .mditeignore together', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'draft.md'), '# Draft (mditeignore)');
      await writeTestFile(join(testDir, 'dist.md'), '# Dist (gitignore)');
      await writeTestFile(join(testDir, 'temp.md'), '# Temp (CLI)');
      await writeTestFile(join(testDir, '.mditeignore'), 'draft.md');
      await writeTestFile(join(testDir, '.gitignore'), 'dist.md');

      const result = runCli(['lint', '--exclude', 'temp.md', '--respect-gitignore']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('draft.md');
      expect(result.stdout).not.toContain('dist.md');
      expect(result.stdout).not.toContain('temp.md');
      expect(result.stderr).toContain('No issues found');
    });
  });

  describe('excludeHidden option', () => {
    it('should exclude hidden directories by default', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await fs.mkdir(join(testDir, '.hidden'), { recursive: true });
      await writeTestFile(join(testDir, '.hidden/secret.md'), '# Secret');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('.hidden/secret.md');
      expect(result.stderr).toContain('No issues found');
    });

    it('should include hidden directories with --no-exclude-hidden', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main\n\n[Secret](./.hidden/secret.md)');
      await fs.mkdir(join(testDir, '.hidden'), { recursive: true });
      await writeTestFile(join(testDir, '.hidden/secret.md'), '# Secret');

      const result = runCli(['lint', '--no-exclude-hidden']);

      expect(result.exitCode).toBe(0);
      // .hidden/secret.md should be included and valid
      expect(result.stdout).not.toContain('Dead link');
      expect(result.stderr).toContain('No issues found');
    });

    it('should exclude .git directory by default', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await fs.mkdir(join(testDir, '.git'), { recursive: true });
      await writeTestFile(join(testDir, '.git/config.md'), '# Git Config');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('.git/config.md');
      expect(result.stderr).toContain('No issues found');
    });
  });

  describe('node_modules exclusion', () => {
    it('should exclude node_modules by default', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await fs.mkdir(join(testDir, 'node_modules/pkg'), { recursive: true });
      await writeTestFile(join(testDir, 'node_modules/pkg/README.md'), '# Package');

      const result = runCli(['lint']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('node_modules/pkg/README.md');
      expect(result.stderr).toContain('No issues found');
    });
  });

  describe('edge cases', () => {
    it('should handle patterns with trailing slashes', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await fs.mkdir(join(testDir, 'drafts'), { recursive: true });
      await writeTestFile(join(testDir, 'drafts/wip.md'), '# WIP');

      const result = runCli(['lint', '--exclude', 'drafts/']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('drafts/wip.md');
      expect(result.stderr).toContain('No issues found');
    });

    it('should handle deeply nested exclusions', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await fs.mkdir(join(testDir, 'a/b/c'), { recursive: true });
      await writeTestFile(join(testDir, 'a/b/c/deep.md'), '# Deep');

      const result = runCli(['lint', '--exclude', 'a/b/c/**']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('a/b/c/deep.md');
      expect(result.stderr).toContain('No issues found');
    });

    it('should handle exclusion of entrypoint (should not crash)', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');

      const result = runCli(['lint', '--exclude', 'README.md']);

      // Excluding entrypoint is allowed - it just results in no files found
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('Found 0 reachable files');
    });

    it('should handle empty exclude patterns', async () => {
      await writeTestFile(join(testDir, 'README.md'), '# Main');
      await writeTestFile(join(testDir, 'orphan.md'), '# Orphan');

      const result = runCli(['lint', '--exclude', '']);

      // Empty pattern should be ignored, orphan should still be detected
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Orphaned file');
    });
  });

  describe('deps command exclusion', () => {
    it('should exclude files from dependency tree', async () => {
      await writeTestFile(
        join(testDir, 'README.md'),
        '# Main\n\n[Guide](./guide.md)\n[Draft](./draft.md)'
      );
      await writeTestFile(join(testDir, 'guide.md'), '# Guide\n\n[Sub](./sub.md)');
      await writeTestFile(join(testDir, 'draft.md'), '# Draft\n\n[Internal](./internal.md)');
      await writeTestFile(join(testDir, 'sub.md'), '# Sub');
      await writeTestFile(join(testDir, 'internal.md'), '# Internal');

      const result = runCli([
        'deps',
        'README.md',
        '--exclude',
        'draft.md',
        '--exclude',
        'internal.md',
      ]);

      expect(result.exitCode).toBe(0);
      // Excluded files should NOT appear in deps output
      expect(result.stdout).not.toContain('draft.md');
      expect(result.stdout).not.toContain('internal.md');
      // Non-excluded files and their dependencies appear
      expect(result.stdout).toContain('guide.md');
      expect(result.stdout).toContain('sub.md');
    });
  });
});
