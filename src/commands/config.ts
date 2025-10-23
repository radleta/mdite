import { Command } from 'commander';
import { ConfigManager } from '../core/config-manager.js';
import { Logger, shouldUseColors } from '../utils/logger.js';
import { CliOptions } from '../types/config.js';
import { ExitCode } from '../types/exit-codes.js';

// ============================================================================
// Help Text - Colocated with command for easy maintenance
// ============================================================================

const DESCRIPTION = `
DESCRIPTION:
  Display the merged configuration from all sources.
  Shows the final runtime configuration after merging:

  1. Built-in defaults
  2. User config (~/.config/mdite/config.json)
  3. Project config (.mditerc, mdite.config.js, etc.)
  4. CLI flags (not shown here, applied at runtime)

  Useful for debugging configuration issues and understanding
  which values are being used.
`;

const EXAMPLES = `
EXAMPLES:
  View current configuration:
      $ mdite config

  Use custom config file:
      $ mdite config --config custom.config.js

  Extract specific config value with jq:
      $ mdite config --quiet | jq '.entrypoint'
`;

const SEE_ALSO = `
SEE ALSO:
  mdite init  Create configuration file
`;

// ============================================================================
// Command Definition
// ============================================================================

export function configCommand(): Command {
  return new Command('config')
    .description('Show current configuration')
    .addHelpText('after', DESCRIPTION)
    .addHelpText('after', EXAMPLES)
    .addHelpText('after', SEE_ALSO)
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
