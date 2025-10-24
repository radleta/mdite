import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';

/**
 * Integration tests for CLI help text
 *
 * These tests verify that all enhanced help sections are present and correctly formatted.
 * They test the actual CLI output by spawning the process, ensuring real-world behavior.
 */

function getHelp(args: string[] = ['--help']): string {
  const result = spawnSync('node', ['dist/src/index.js', ...args], {
    encoding: 'utf-8',
    cwd: process.cwd(),
  });

  return result.stdout || '';
}

describe('CLI Help Enhancement', () => {
  describe('Main help (mdite --help)', () => {
    it('should include extended description section', () => {
      const help = getHelp();
      expect(help).toContain('DESCRIPTION:');
      expect(help).toContain('mdite treats your markdown documentation as a connected system');
      expect(help).toContain('Key concepts:');
      expect(help).toContain('Documentation graph');
      expect(help).toContain('Entrypoint');
      expect(help).toContain('Orphans');
    });

    it('should include examples section', () => {
      const help = getHelp();
      expect(help).toContain('EXAMPLES:');
      expect(help).toContain('Validate your documentation:');
      expect(help).toContain('$ mdite lint');
      expect(help).toContain('$ mdite deps docs/api.md --incoming');
      expect(help).toContain('$ mdite files | xargs rg "authentication"');
    });

    it('should include exit codes section', () => {
      const help = getHelp();
      expect(help).toContain('EXIT CODES:');
      expect(help).toContain('0    Success');
      expect(help).toContain('1    Validation errors');
      expect(help).toContain('2    Usage errors');
      expect(help).toContain('130  Interrupted');
    });

    it('should include environment variables section', () => {
      const help = getHelp();
      expect(help).toContain('ENVIRONMENT:');
      expect(help).toContain('NO_COLOR');
      expect(help).toContain('FORCE_COLOR');
      expect(help).toContain('CI=true');
    });

    it('should include configuration section', () => {
      const help = getHelp();
      expect(help).toContain('CONFIGURATION:');
      expect(help).toContain('Config files loaded in priority order:');
      expect(help).toContain('CLI flags');
      expect(help).toContain('Project config');
      expect(help).toContain('User config');
    });
  });

  describe('lint --help', () => {
    it('should include extended description', () => {
      const help = getHelp(['lint', '--help']);
      expect(help).toContain('DESCRIPTION:');
      expect(help).toContain('Validate documentation structure and content');
      expect(help).toContain('Orphaned files');
      expect(help).toContain('Broken file links');
      expect(help).toContain('Broken anchor links');
      expect(help).toContain('Multi-file mode');
    });

    it('should include examples section with multiple examples', () => {
      const help = getHelp(['lint', '--help']);
      expect(help).toContain('EXAMPLES:');
      expect(help).toContain('$ mdite lint');
      expect(help).toContain('$ mdite lint ./docs');
      expect(help).toContain('--format json');
      expect(help).toContain('pre-commit hook');
      expect(help).toContain('--depth 2');
    });

    it('should include output section', () => {
      const help = getHelp(['lint', '--help']);
      expect(help).toContain('OUTPUT:');
      expect(help).toContain('stdout');
      expect(help).toContain('stderr');
      expect(help).toContain('pipeable');
    });

    it('should include see also section', () => {
      const help = getHelp(['lint', '--help']);
      expect(help).toContain('SEE ALSO:');
      expect(help).toContain('mdite deps');
      expect(help).toContain('mdite files');
      expect(help).toContain('mdite config');
    });
  });

  describe('files --help', () => {
    it('should include extended description with Unix philosophy', () => {
      const help = getHelp(['files', '--help']);
      expect(help).toContain('DESCRIPTION:');
      expect(help).toContain('Unix philosophy');
      expect(help).toContain('graph-filtered file lists');
      expect(help).toContain('compose with the Unix ecosystem');
    });

    it('should include comprehensive examples with Unix composition', () => {
      const help = getHelp(['files', '--help']);
      expect(help).toContain('EXAMPLES:');
      expect(help).toContain('$ mdite files');
      expect(help).toContain('xargs rg');
      expect(help).toContain('xargs prettier');
      expect(help).toContain('xargs markdownlint');
      expect(help).toContain('--frontmatter');
      expect(help).toContain('jq');
    });

    it('should include see also with JMESPath link', () => {
      const help = getHelp(['files', '--help']);
      expect(help).toContain('SEE ALSO:');
      expect(help).toContain('JMESPath query syntax:');
      expect(help).toContain('https://jmespath.org/');
    });
  });

  describe('deps --help', () => {
    it('should include extended description with use cases', () => {
      const help = getHelp(['deps', '--help']);
      expect(help).toContain('DESCRIPTION:');
      expect(help).toContain('dependency relationships');
      expect(help).toContain('Impact analysis');
      expect(help).toContain('Refactoring');
      expect(help).toContain('Output formats:');
    });

    it('should include examples section', () => {
      const help = getHelp(['deps', '--help']);
      expect(help).toContain('EXAMPLES:');
      expect(help).toContain('$ mdite deps README.md');
      expect(help).toContain('--incoming');
      expect(help).toContain('--outgoing');
      expect(help).toContain('--format json');
    });

    it('should include see also section', () => {
      const help = getHelp(['deps', '--help']);
      expect(help).toContain('SEE ALSO:');
      expect(help).toContain('mdite lint');
      expect(help).toContain('mdite files');
    });
  });

  describe('cat --help', () => {
    it('should include extended description with use cases', () => {
      const help = getHelp(['cat', '--help']);
      expect(help).toContain('DESCRIPTION:');
      expect(help).toContain('Output documentation content');
      expect(help).toContain('Unix composition');
      expect(help).toContain('pandoc');
    });

    it('should include examples with piping patterns', () => {
      const help = getHelp(['cat', '--help']);
      expect(help).toContain('EXAMPLES:');
      expect(help).toContain('$ mdite cat');
      expect(help).toContain('pandoc');
      expect(help).toContain('grep');
      expect(help).toContain('wc -w');
    });

    it('should include see also section', () => {
      const help = getHelp(['cat', '--help']);
      expect(help).toContain('SEE ALSO:');
      expect(help).toContain('mdite files');
      expect(help).toContain('mdite deps');
    });
  });

  describe('init --help', () => {
    it('should include extended description with config formats', () => {
      const help = getHelp(['init', '--help']);
      expect(help).toContain('DESCRIPTION:');
      expect(help).toContain('configuration file');
      expect(help).toContain('Supported formats:');
      expect(help).toContain('mdite.config.js');
      expect(help).toContain('.mditerc');
      expect(help).toContain('Config precedence');
    });

    it('should include examples section', () => {
      const help = getHelp(['init', '--help']);
      expect(help).toContain('EXAMPLES:');
      expect(help).toContain('$ mdite init');
      expect(help).toContain('--config');
    });

    it('should include see also section', () => {
      const help = getHelp(['init', '--help']);
      expect(help).toContain('SEE ALSO:');
      expect(help).toContain('mdite config');
    });
  });

  describe('config --help', () => {
    it('should include extended description', () => {
      const help = getHelp(['config', '--help']);
      expect(help).toContain('DESCRIPTION:');
      expect(help).toContain('merged configuration');
      expect(help).toContain('Built-in defaults');
      expect(help).toContain('User config');
      expect(help).toContain('Project config');
    });

    it('should include examples section', () => {
      const help = getHelp(['config', '--help']);
      expect(help).toContain('EXAMPLES:');
      expect(help).toContain('$ mdite config');
      expect(help).toContain('jq');
    });

    it('should include see also section', () => {
      const help = getHelp(['config', '--help']);
      expect(help).toContain('SEE ALSO:');
      expect(help).toContain('mdite init');
    });
  });

  describe('Help formatting', () => {
    it('should not show colors when piped', () => {
      const help = getHelp();
      // ANSI color codes should not be present when output is piped
      expect(help).not.toMatch(/\x1b\[\d+m/);
    });

    it('should have consistent section headers', () => {
      const commands = ['lint', 'deps', 'cat', 'files', 'init', 'config'];

      for (const cmd of commands) {
        const help = getHelp([cmd, '--help']);

        // All commands should have DESCRIPTION
        expect(help).toContain('DESCRIPTION:');

        // All commands should have EXAMPLES
        expect(help).toContain('EXAMPLES:');

        // All commands should have SEE ALSO
        expect(help).toContain('SEE ALSO:');
      }
    });

    it('should use $ prefix for example commands', () => {
      const help = getHelp(['lint', '--help']);
      const examples = help.split('EXAMPLES:')[1];

      expect(examples).toBeDefined();

      // Count $ occurrences (should match number of examples)
      const exampleCount = (examples?.match(/\$\s+mdite/g) || []).length;
      expect(exampleCount).toBeGreaterThan(5); // lint has 10 examples
    });
  });
});
