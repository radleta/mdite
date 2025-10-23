import { Command } from 'commander';
import { createRequire } from 'module';
import { lintCommand } from './commands/lint.js';
import { initCommand } from './commands/init.js';
import { configCommand } from './commands/config.js';
import { depsCommand } from './commands/deps.js';
import { catCommand } from './commands/cat.js';
import { filesCommand } from './commands/files.js';
import { ExitCode } from './types/exit-codes.js';
import {
  EXIT_CODES,
  ENVIRONMENT_VARS,
  CONFIG_PRECEDENCE,
  MAIN_EXAMPLES,
  MAIN_DESCRIPTION,
} from './utils/help-text.js';

// Import version from package.json
const require = createRequire(import.meta.url);
const { version: VERSION } = require('../../package.json');

/**
 * Setup handlers for Unix signals
 */
function setupSignalHandlers(): void {
  // SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.error('\nInterrupted');
    process.exit(ExitCode.INTERRUPTED);
  });

  // SIGTERM (kill)
  process.on('SIGTERM', () => {
    console.error('\nTerminated');
    process.exit(ExitCode.INTERRUPTED);
  });

  // SIGPIPE (broken pipe - normal when piping to head, etc.)
  // Ignore it to allow clean piping
  process.on('SIGPIPE', () => {
    process.exit(ExitCode.SUCCESS);
  });

  // Uncaught errors
  process.on('uncaughtException', (error: Error) => {
    console.error('Fatal error:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(ExitCode.ERROR);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    console.error('Unhandled rejection:', reason);
    process.exit(ExitCode.ERROR);
  });
}

export async function cli() {
  const program = new Command();

  program
    .name('mdite')
    .description(
      'Markdown documentation toolkit - Work with your documentation as a connected system'
    )
    .addHelpText('after', MAIN_DESCRIPTION)
    .version(VERSION);

  // Global options
  program
    .option('--config <path>', 'Config file path')
    .option('--colors', 'Force colored output (even when piped)')
    .option('--no-colors', 'Disable colored output')
    .option('-q, --quiet', 'Quiet mode (suppress informational output)')
    .option('--verbose', 'Verbose output');

  // Add global help sections
  program
    .addHelpText('after', MAIN_EXAMPLES)
    .addHelpText('after', EXIT_CODES)
    .addHelpText('after', ENVIRONMENT_VARS)
    .addHelpText('after', CONFIG_PRECEDENCE);

  // Setup signal handlers before parsing
  setupSignalHandlers();

  // Register commands
  program.addCommand(lintCommand());
  program.addCommand(initCommand());
  program.addCommand(configCommand());
  program.addCommand(depsCommand());
  program.addCommand(catCommand());
  program.addCommand(filesCommand());

  await program.parseAsync(process.argv);
}
