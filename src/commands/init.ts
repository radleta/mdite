import { Command } from 'commander';
import { Logger, shouldUseColors } from '../utils/logger.js';
import { ExitCode } from '../types/exit-codes.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const DEFAULT_CONFIG = `module.exports = {
  entrypoint: 'README.md',
  rules: {
    'orphan-files': 'error',
    'dead-link': 'error',
    'dead-anchor': 'error',
  },
};
`;

export function initCommand(): Command {
  return new Command('init')
    .description('Initialize mdite configuration file')
    .option('--config <path>', 'Config file path', 'mdite.config.js')
    .action(async (options, command) => {
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
        const configPath = path.resolve(options.config);

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
