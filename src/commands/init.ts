import { Command } from 'commander';
import { Logger } from '../utils/logger.js';
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
    .description('Initialize doc-lint configuration file')
    .option('--config <path>', 'Config file path', 'doclint.config.js')
    .action(async (options, command) => {
      const logger = new Logger(command.optsWithGlobals().colors !== false);

      try {
        const configPath = path.resolve(options.config);

        // Check if config already exists
        const exists = await fs
          .access(configPath)
          .then(() => true)
          .catch(() => false);

        if (exists) {
          logger.error(`Configuration file already exists: ${configPath}`);
          process.exit(1);
        }

        // Write config
        await fs.writeFile(configPath, DEFAULT_CONFIG, 'utf-8');

        logger.success(`Created configuration file: ${configPath}`);
        logger.line();
        logger.info('Next steps:');
        logger.log('  1. Edit the configuration to match your project');
        logger.log('  2. Run: doc-lint lint');
        logger.line();
      } catch (error) {
        logger.error('Failed to create configuration', error as Error);
        process.exit(1);
      }
    });
}
