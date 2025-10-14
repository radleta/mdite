import { Command } from 'commander';
import { createRequire } from 'module';
import { lintCommand } from './commands/lint.js';
import { initCommand } from './commands/init.js';
import { configCommand } from './commands/config.js';

// Import version from package.json
const require = createRequire(import.meta.url);
const { version: VERSION } = require('../../package.json');

export async function cli() {
  const program = new Command();

  program
    .name('doc-lint')
    .description('Project-level documentation linter')
    .version(VERSION);

  // Global options
  program
    .option('--config <path>', 'Config file path')
    .option('--no-colors', 'Disable colored output')
    .option('--verbose', 'Verbose output');

  // Register commands
  program.addCommand(lintCommand());
  program.addCommand(initCommand());
  program.addCommand(configCommand());

  await program.parseAsync(process.argv);
}
