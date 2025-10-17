import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';

function runCli(args: string[]): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const result = spawnSync('node', ['dist/src/index.js', ...args], {
    encoding: 'utf-8',
  });

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status || 0,
  };
}

describe('CLI', () => {
  it('shows version', () => {
    const result = runCli(['--version']);
    expect(result.stdout.trim()).toBe('0.1.0');
  });

  it('shows help', () => {
    const result = runCli(['--help']);
    expect(result.stdout).toContain('Markdown documentation toolkit');
    expect(result.stdout).toContain('Commands:');
    expect(result.stdout).toContain('lint');
  });

  it('lints valid docs successfully', () => {
    // Success message now goes to stderr
    const result = runCli(['lint', 'tests/fixtures/valid-docs']);
    expect(result.stderr).toContain('No issues found!');
    expect(result.exitCode).toBe(0);
  });

  it('detects orphaned files', () => {
    const result = runCli(['lint', 'tests/fixtures/with-orphans']);
    expect(result.stdout).toContain('orphan.md');
    expect(result.stdout).toContain('Orphaned file');
    expect(result.exitCode).toBe(1);
  });

  it('detects broken links', () => {
    const result = runCli(['lint', 'tests/fixtures/broken-links']);
    expect(result.stdout).toContain('Dead link');
    expect(result.stdout).toContain('nonexistent.md');
    expect(result.exitCode).toBe(1);
  });

  it('detects broken anchors', () => {
    const result = runCli(['lint', 'tests/fixtures/broken-anchors']);
    expect(result.stdout).toContain('Dead anchor');
    expect(result.stdout).toContain('nonexistent-section');
    expect(result.exitCode).toBe(1);
  });

  it('supports JSON output format', () => {
    const result = runCli(['lint', 'tests/fixtures/with-orphans', '--format', 'json']);
    const json = JSON.parse(result.stdout);
    expect(Array.isArray(json)).toBe(true);
    expect(json[0]).toHaveProperty('rule');
    expect(json[0]).toHaveProperty('severity');
    expect(json[0]).toHaveProperty('file');
    expect(result.exitCode).toBe(1);
  });
});
