import { Command } from 'commander';
import { ConfigManager } from '../core/config-manager.js';
import { Logger } from '../utils/logger.js';
import { CliOptions } from '../types/config.js';

export function configCommand(): Command {
  return new Command('config')
    .description('Show current configuration')
    .action(async (_options, command) => {
      const globalOpts = command.optsWithGlobals();
      const logger = new Logger(globalOpts.colors !== false);

      try {
        // Build CLI options
        const cliOptions: CliOptions = {
          verbose: globalOpts.verbose,
          config: globalOpts.config,
          colors: globalOpts.colors,
        };

        // Load configuration with proper layering
        const configManager = await ConfigManager.load(cliOptions);
        const config = configManager.getConfig();

        logger.header('Current Configuration');
        logger.line();
        console.log(JSON.stringify(config, null, 2));
      } catch (error) {
        logger.error('Failed to load configuration', error as Error);
        process.exit(1);
      }
    });
}
