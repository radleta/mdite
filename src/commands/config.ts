import { Command } from 'commander';
import { ConfigManager } from '../core/config-manager.js';
import { Logger } from '../utils/logger.js';

export function configCommand(): Command {
  return new Command('config')
    .description('Show current configuration')
    .action(async (_options, command) => {
      const logger = new Logger(command.optsWithGlobals().colors !== false);

      try {
        const configManager = new ConfigManager();
        const config = await configManager.load(command.optsWithGlobals());

        logger.header('Current Configuration');
        logger.line();
        console.log(JSON.stringify(config, null, 2));
      } catch (error) {
        logger.error('Failed to load configuration', error as Error);
        process.exit(1);
      }
    });
}
