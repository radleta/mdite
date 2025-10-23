import { Command } from 'commander';
import { Logger, shouldUseColors } from '../utils/logger.js';
import { ExitCode } from '../types/exit-codes.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Help Text - Colocated with command for easy maintenance
// ============================================================================

const DESCRIPTION = `
DESCRIPTION:
  Create a configuration file for mdite in your project.

  Supported formats:
    - mdite.config.js    JavaScript (comments, computed values)
    - .mditerc           JSON (simple, no comments)
    - .mditerc.yaml      YAML (human-readable)
    - package.json       "mdite": {} section

  Config precedence (highest to lowest):
    1. CLI flags (--entrypoint, --format, etc.)
    2. Project config (created by this command)
    3. User config (~/.config/mdite/config.json)
    4. Built-in defaults
`;

const EXAMPLES = `
EXAMPLES:
  Create default config file:
      $ mdite init

  Create config with custom path:
      $ mdite init --config .mditerc.json

  View current configuration:
      $ mdite config
`;

const SEE_ALSO = `
SEE ALSO:
  mdite config  View current configuration
`;

// ============================================================================
// Default Configuration Template
// ============================================================================

const DEFAULT_CONFIG = `module.exports = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // mdite Configuration
  // Docs: https://github.com/radleta/mdite#configuration
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Entry point for documentation graph traversal
  entrypoint: 'README.md',

  // Validation rules (error | warn | off)
  rules: {
    'orphan-files': 'error',  // Files not linked from entrypoint
    'dead-link': 'error',     // Broken file links
    'dead-anchor': 'error',   // Broken heading anchors
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Optional: Uncomment to customize
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Limit graph traversal depth
  // depth: 3,

  // Exclude files (gitignore-style patterns)
  // exclude: ['drafts/**', '*.temp.md'],

  // Performance tuning (1-100)
  // maxConcurrency: 10,

  // Run 'mdite config --schema' to see all options
  // Run 'mdite config --template' for comprehensive template
};
`;

// ============================================================================
// Command Definition
// ============================================================================

export function initCommand(): Command {
  return new Command('init')
    .description('Initialize mdite configuration file')
    .addHelpText('after', DESCRIPTION)
    .addHelpText('after', EXAMPLES)
    .addHelpText('after', SEE_ALSO)
    .action(async (_options, command) => {
      const globalOpts = command.optsWithGlobals();

      // Determine colors setting
      const colors = (() => {
        if (globalOpts.colors === true) return true; // Forced on
        if (globalOpts.colors === false) return false; // Forced off
        return shouldUseColors(); // Auto-detect
      })();

      const logger = new Logger(colors, {
        quiet: globalOpts.quiet ?? false,
        verbose: globalOpts.verbose ?? false,
      });

      try {
        const configPath = path.resolve(globalOpts.config ?? 'mdite.config.js');

        // Check if config already exists
        const exists = await fs
          .access(configPath)
          .then(() => true)
          .catch(() => false);

        if (exists) {
          logger.error(`Configuration file already exists: ${configPath}`);
          process.exit(ExitCode.USAGE_ERROR);
        }

        // Write config
        await fs.writeFile(configPath, DEFAULT_CONFIG, 'utf-8');

        logger.success(`Created configuration file: ${configPath}`);
        logger.line();
        logger.info('Next steps:');
        logger.info('  1. Edit the configuration to match your project');
        logger.info('  2. Run: mdite lint');
        logger.line();

        process.exit(ExitCode.SUCCESS);
      } catch (error) {
        logger.error('Failed to create configuration', error as Error);
        process.exit(ExitCode.ERROR);
      }
    });
}
