import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

// Absolute path to the CLI binary
const CLI_PATH = resolve(process.cwd(), 'dist/src/index.js');

describe('mdite config advanced features', () => {
  describe('--schema flag', () => {
    describe('Text format', () => {
      it('should display all config options', () => {
        const result = spawnSync('node', ['dist/src/index.js', 'config', '--schema'], {
          encoding: 'utf-8',
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('entrypoint');
        expect(result.stdout).toContain('depth');
        expect(result.stdout).toContain('maxConcurrency');
        expect(result.stdout).toContain('exclude');
        expect(result.stdout).toContain('scopeLimit');
      });

      it('should group options by category', () => {
        const result = spawnSync('node', ['dist/src/index.js', 'config', '--schema'], {
          encoding: 'utf-8',
        });

        expect(result.status).toBe(0);
        const output = result.stdout + result.stderr;
        expect(output).toContain('CORE OPTIONS');
        expect(output).toContain('RULES');
        expect(output).toContain('PERFORMANCE');
        expect(output).toContain('EXCLUSION');
        expect(output).toContain('SCOPE');
      });

      it('should show types and defaults', () => {
        const result = spawnSync('node', ['dist/src/index.js', 'config', '--schema'], {
          encoding: 'utf-8',
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('Type:');
        expect(result.stdout).toContain('Default:');
        expect(result.stdout).toContain('Layer:');
        expect(result.stdout).toContain('Example:');
      });

      it('should include configuration layers section', () => {
        const result = spawnSync('node', ['dist/src/index.js', 'config', '--schema'], {
          encoding: 'utf-8',
        });

        expect(result.status).toBe(0);
        const output = result.stdout + result.stderr;
        expect(output).toContain('CONFIGURATION LAYERS');
        expect(output).toContain('Defaults');
        expect(output).toContain('User');
        expect(output).toContain('Project');
        expect(output).toContain('Cli');
      });

      it('should include see also section', () => {
        const result = spawnSync('node', ['dist/src/index.js', 'config', '--schema'], {
          encoding: 'utf-8',
        });

        expect(result.status).toBe(0);
        const output = result.stdout + result.stderr;
        expect(output).toContain('SEE ALSO');
        expect(output).toContain('mdite config --explain');
        expect(output).toContain('mdite config --template');
      });
    });

    describe('JSON format', () => {
      it('should output valid JSON', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--schema', '--format', 'json'],
          {
            encoding: 'utf-8',
          }
        );

        expect(result.status).toBe(0);
        expect(() => JSON.parse(result.stdout)).not.toThrow();
      });

      it('should include all metadata fields', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--schema', '--format', 'json'],
          {
            encoding: 'utf-8',
          }
        );

        const json = JSON.parse(result.stdout);
        expect(json.schema).toBeDefined();
        expect(json.layers).toBeDefined();
        expect(json.rules).toBeDefined();

        // Check a specific option has all fields
        const entrypoint = json.schema.entrypoint;
        expect(entrypoint.description).toBeTruthy();
        expect(entrypoint.type).toBeTruthy();
        expect(entrypoint.default).toBeDefined();
        expect(entrypoint.examples).toBeInstanceOf(Array);
        expect(entrypoint.category).toBeTruthy();
        expect(entrypoint.layer).toBeInstanceOf(Array);
      });

      it('should include all config options in schema', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--schema', '--format', 'json'],
          {
            encoding: 'utf-8',
          }
        );

        const json = JSON.parse(result.stdout);
        const schemaKeys = Object.keys(json.schema);

        // Should have all major config options
        expect(schemaKeys).toContain('entrypoint');
        expect(schemaKeys).toContain('depth');
        expect(schemaKeys).toContain('maxConcurrency');
        expect(schemaKeys).toContain('rules');
        expect(schemaKeys).toContain('exclude');
        expect(schemaKeys.length).toBeGreaterThan(10);
      });
    });

    describe('Global flags integration', () => {
      it('should work with --quiet flag', () => {
        const result = spawnSync('node', ['dist/src/index.js', 'config', '--schema', '--quiet'], {
          encoding: 'utf-8',
        });

        expect(result.status).toBe(0);
        // Should suppress the header in stderr but still show content
        expect(result.stdout).toContain('entrypoint');
      });

      it('should work with --no-colors flag', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--schema', '--no-colors'],
          {
            encoding: 'utf-8',
          }
        );

        expect(result.status).toBe(0);
        // Output should not contain ANSI escape codes
        expect(result.stdout).not.toMatch(/\x1b\[[0-9;]*m/);
      });
    });
  });

  describe('--explain flag', () => {
    describe('Valid keys', () => {
      it('should show all sections for a valid key', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--explain', 'entrypoint'],
          {
            encoding: 'utf-8',
          }
        );

        expect(result.status).toBe(0);
        const output = result.stdout + result.stderr;
        expect(output).toContain('mdite Configuration: entrypoint');
        expect(output).toContain('DESCRIPTION');
        expect(output).toContain('TYPE');
        expect(output).toContain('DEFAULT');
        expect(output).toContain('AVAILABLE IN');
        expect(output).toContain('EXAMPLES');
      });

      it('should show validation if present', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--explain', 'maxConcurrency'],
          {
            encoding: 'utf-8',
          }
        );

        expect(result.status).toBe(0);
        const output = result.stdout + result.stderr;
        expect(output).toContain('VALIDATION');
      });

      it('should show when to change guidance', () => {
        const result = spawnSync('node', ['dist/src/index.js', 'config', '--explain', 'depth'], {
          encoding: 'utf-8',
        });

        expect(result.status).toBe(0);
        const output = result.stdout + result.stderr;
        expect(output).toContain('WHEN TO CHANGE');
      });

      it('should show related options', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--explain', 'scopeRoot'],
          {
            encoding: 'utf-8',
          }
        );

        expect(result.status).toBe(0);
        const output = result.stdout + result.stderr;
        expect(output).toContain('RELATED OPTIONS');
        expect(output).toContain('scopeLimit');
      });

      it('should include see also section', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--explain', 'entrypoint'],
          {
            encoding: 'utf-8',
          }
        );

        expect(result.status).toBe(0);
        const output = result.stdout + result.stderr;
        expect(output).toContain('SEE ALSO');
        expect(output).toContain('mdite config --schema');
        expect(output).toContain('mdite config');
      });
    });

    describe('Invalid keys', () => {
      it('should error on unknown key', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--explain', 'unknownOption'],
          {
            encoding: 'utf-8',
          }
        );

        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain('Unknown configuration key');
      });

      it('should suggest similar keys for typos', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--explain', 'maxConcurency'],
          {
            encoding: 'utf-8',
          }
        );

        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain('Did you mean?');
        expect(result.stderr).toContain('maxConcurrency');
      });

      it('should reference --schema for help', () => {
        const result = spawnSync('node', ['dist/src/index.js', 'config', '--explain', 'invalid'], {
          encoding: 'utf-8',
        });

        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain('mdite config --schema');
      });
    });

    describe('All config keys', () => {
      const configKeys = [
        'entrypoint',
        'depth',
        'format',
        'colors',
        'verbose',
        'maxConcurrency',
        'rules',
        'exclude',
        'respectGitignore',
        'excludeHidden',
        'scopeLimit',
        'scopeRoot',
        'externalLinks',
      ];

      configKeys.forEach(key => {
        it(`should explain ${key} successfully`, () => {
          const result = spawnSync('node', ['dist/src/index.js', 'config', '--explain', key], {
            encoding: 'utf-8',
          });

          expect(result.status, `Failed to explain ${key}`).toBe(0);
          const output = result.stdout + result.stderr;
          expect(output, `${key} output missing`).toContain(`mdite Configuration: ${key}`);
        });
      });
    });
  });

  describe('--template flag', () => {
    describe('JavaScript template', () => {
      it('should generate valid JavaScript', () => {
        const result = spawnSync('node', ['dist/src/index.js', 'config', '--template'], {
          encoding: 'utf-8',
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('module.exports = {');
        expect(result.stdout).toContain('};');

        // Should be parseable (no syntax errors)
        // We can't eval it directly but we can check structure
        expect(result.stdout).toMatch(/module\.exports\s*=\s*\{[\s\S]*\};/);
      });

      it('should include all config options', () => {
        const result = spawnSync('node', ['dist/src/index.js', 'config', '--template'], {
          encoding: 'utf-8',
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('entrypoint');
        expect(result.stdout).toContain('rules');
        expect(result.stdout).toContain('maxConcurrency');
        expect(result.stdout).toContain('exclude');
        expect(result.stdout).toContain('scopeLimit');
      });

      it('should include helpful comments', () => {
        const result = spawnSync('node', ['dist/src/index.js', 'config', '--template'], {
          encoding: 'utf-8',
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('// mdite Configuration');
        expect(result.stdout).toContain('// CORE OPTIONS');
        expect(result.stdout).toContain('// PERFORMANCE');
        expect(result.stdout).toContain("// Run 'mdite config --schema'");
      });
    });

    describe('JSON template', () => {
      it('should generate valid JSON', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--template', '--format', 'json'],
          {
            encoding: 'utf-8',
          }
        );

        expect(result.status).toBe(0);
        expect(() => JSON.parse(result.stdout)).not.toThrow();
      });

      it('should include schema reference', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--template', '--format', 'json'],
          {
            encoding: 'utf-8',
          }
        );

        const json = JSON.parse(result.stdout);
        expect(json.$schema).toBeDefined();
      });
    });

    describe('YAML template', () => {
      it('should generate YAML format', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--template', '--format', 'yaml'],
          {
            encoding: 'utf-8',
          }
        );

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('entrypoint:');
        expect(result.stdout).toContain('rules:');
        expect(result.stdout).toContain('# mdite Configuration');
      });
    });

    describe('Markdown template', () => {
      it('should generate Markdown format', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--template', '--format', 'md'],
          {
            encoding: 'utf-8',
          }
        );

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('# mdite Configuration Reference');
        expect(result.stdout).toContain('## Core Options');
        expect(result.stdout).toContain('### entrypoint');
        expect(result.stdout).toContain('```');
      });
    });

    describe('File output', () => {
      let testDir: string;

      beforeEach(() => {
        testDir = mkdtempSync(join(tmpdir(), 'mdite-test-'));
      });

      it('should write to file with --output', () => {
        const outputFile = join(testDir, 'test.config.js');
        const result = spawnSync(
          'node',
          [CLI_PATH, 'config', '--template', '--output', outputFile],
          {
            encoding: 'utf-8',
            cwd: testDir,
          }
        );

        expect(result.status).toBe(0);
        expect(result.stderr).toContain('Template written to');

        // Verify file exists and has content
        const fs = require('fs');
        const content = fs.readFileSync(outputFile, 'utf-8');
        expect(content).toContain('module.exports = {');
      });

      it('should error if file already exists', () => {
        const outputFile = join(testDir, 'existing.js');
        writeFileSync(outputFile, '// existing');

        const result = spawnSync(
          'node',
          [CLI_PATH, 'config', '--template', '--output', outputFile],
          {
            encoding: 'utf-8',
            cwd: testDir,
          }
        );

        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain('already exists');
      });

      // Cleanup
      afterEach(() => {
        if (testDir) {
          try {
            rmSync(testDir, { recursive: true, force: true });
          } catch {
            // Ignore cleanup errors
          }
        }
      });
    });

    describe('Error handling', () => {
      it('should error on invalid format', () => {
        const result = spawnSync(
          'node',
          ['dist/src/index.js', 'config', '--template', '--format', 'invalid'],
          {
            encoding: 'utf-8',
          }
        );

        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain('Invalid format');
      });
    });
  });

  describe('Improved init template', () => {
    let testDir: string;

    beforeEach(() => {
      testDir = mkdtempSync(join(tmpdir(), 'mdite-test-'));
    });

    it('should create enhanced template with better comments', () => {
      const result = spawnSync('node', [CLI_PATH, 'init'], {
        encoding: 'utf-8',
        cwd: testDir,
      });

      expect(result.status).toBe(0);

      const fs = require('fs');
      const configFile = join(testDir, 'mdite.config.js');
      const content = fs.readFileSync(configFile, 'utf-8');

      // Should have helpful comments
      expect(content).toContain('// mdite Configuration');
      expect(content).toContain('// Entry point for documentation graph traversal');
      expect(content).toContain('// Validation rules (error | warn | off)');
    });

    it('should include discovery pointers', () => {
      const result = spawnSync('node', [CLI_PATH, 'init'], {
        encoding: 'utf-8',
        cwd: testDir,
      });

      expect(result.status).toBe(0);

      const fs = require('fs');
      const configFile = join(testDir, 'mdite.config.js');
      const content = fs.readFileSync(configFile, 'utf-8');

      // Should point to discovery features
      expect(content).toContain("'mdite config --schema'");
      expect(content).toContain("'mdite config --template'");
    });

    it('should show optional configuration commented out', () => {
      const result = spawnSync('node', [CLI_PATH, 'init'], {
        encoding: 'utf-8',
        cwd: testDir,
      });

      expect(result.status).toBe(0);

      const fs = require('fs');
      const configFile = join(testDir, 'mdite.config.js');
      const content = fs.readFileSync(configFile, 'utf-8');

      // Optional fields should be commented
      expect(content).toContain('// depth:');
      expect(content).toContain('// exclude:');
      expect(content).toContain('// maxConcurrency:');
    });

    // Cleanup
    afterEach(() => {
      if (testDir) {
        try {
          rmSync(testDir, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });
});
