import { Command } from 'commander';
import { createRequire } from 'module';
import { lintCommand } from './commands/lint.js';
import { initCommand } from './commands/init.js';
import { configCommand } from './commands/config.js';
import { depsCommand } from './commands/deps.js';

// Import version from package.json
const require = createRequire(import.meta.url);
const { version: VERSION } = require('../../package.json');

export async function cli() {
  const program = new Command();

  program
    .name('mdite')
    .description(
      'Markdown documentation toolkit - Work with your documentation as a connected system'
    )
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
  program.addCommand(depsCommand());

  await program.parseAsync(process.argv);
}
