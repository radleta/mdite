import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

const CLI = 'node dist/index.js';

describe('CLI', () => {
  it('shows version', () => {
    const output = execSync(`${CLI} --version`).toString();
    expect(output.trim()).toBe('0.1.0');
  });

  it('shows help', () => {
    const output = execSync(`${CLI} --help`).toString();
    expect(output).toContain('Project-level documentation linter');
    expect(output).toContain('Commands:');
    expect(output).toContain('lint');
  });

  it('lints valid docs successfully', () => {
    const output = execSync(`${CLI} lint tests/fixtures/valid-docs`).toString();
    expect(output).toContain('No issues found!');
  });

  it('detects orphaned files', () => {
    try {
      execSync(`${CLI} lint tests/fixtures/with-orphans`);
    } catch (error: any) {
      const output = error.stdout.toString();
      expect(output).toContain('orphan.md');
      expect(output).toContain('Orphaned file');
      expect(error.status).toBe(1);
    }
  });

  it('detects broken links', () => {
    try {
      execSync(`${CLI} lint tests/fixtures/broken-links`);
    } catch (error: any) {
      const output = error.stdout.toString();
      expect(output).toContain('Dead link');
      expect(output).toContain('nonexistent.md');
      expect(error.status).toBe(1);
    }
  });

  it('detects broken anchors', () => {
    try {
      execSync(`${CLI} lint tests/fixtures/broken-anchors`);
    } catch (error: any) {
      const output = error.stdout.toString();
      expect(output).toContain('Dead anchor');
      expect(output).toContain('nonexistent-section');
      expect(error.status).toBe(1);
    }
  });

  it('supports JSON output format', () => {
    try {
      execSync(`${CLI} lint tests/fixtures/with-orphans --format json`);
    } catch (error: any) {
      const output = error.stdout.toString();
      const json = JSON.parse(output);
      expect(Array.isArray(json)).toBe(true);
      expect(json[0]).toHaveProperty('rule');
      expect(json[0]).toHaveProperty('severity');
      expect(json[0]).toHaveProperty('file');
    }
  });
});
