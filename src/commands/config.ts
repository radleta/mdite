import { Command } from 'commander';
import { ConfigManager } from '../core/config-manager.js';
import { Logger, shouldUseColors } from '../utils/logger.js';
import { CliOptions } from '../types/config.js';
import { ExitCode } from '../types/exit-codes.js';

export function configCommand(): Command {
  return new Command('config')
    .description('Show current configuration')
    .action(async (_options, command) => {
      const globalOpts = command.optsWithGlobals();

      // Determine colors setting (always false for config JSON output)
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
        // Build CLI options
        const cliOptions: CliOptions = {
          verbose: globalOpts.verbose,
          config: globalOpts.config,
          colors: globalOpts.colors,
        };

        // Load configuration with proper layering
        const configManager = await ConfigManager.load(cliOptions);
        const config = configManager.getConfig();

        // Header to stderr (can be suppressed with --quiet or 2>/dev/null)
        logger.header('Current Configuration');
        logger.line();

        // JSON to stdout (always, for piping)
        console.log(JSON.stringify(config, null, 2));

        process.exit(ExitCode.SUCCESS);
      } catch (error) {
        logger.error('Failed to load configuration', error as Error);
        process.exit(ExitCode.ERROR);
      }
    });
}
