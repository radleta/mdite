import { Command } from 'commander';
import { writeSync } from 'fs';
import { ConfigManager } from '../core/config-manager.js';
import { Logger, shouldUseColors } from '../utils/logger.js';
import { CliOptions } from '../types/config.js';
import { ExitCode } from '../types/exit-codes.js';
import {
  CONFIG_METADATA,
  RULES_METADATA,
  CONFIG_LAYERS,
  getMetadataByCategory,
  fuzzyMatch,
} from '../types/config-metadata.js';

// ============================================================================
// Help Text - Colocated with command for easy maintenance
// ============================================================================

const DESCRIPTION = `
DESCRIPTION:
  Display or explore mdite configuration.

  Without flags: Shows merged configuration from all sources
  With --schema: Shows all available configuration options
  With --explain: Shows detailed docs for specific option
  With --sources: Shows which layer provides each value
  With --template: Generates comprehensive config template

  Configuration layers (highest to lowest priority):
    1. CLI flags (--entrypoint, --format, etc.)
    2. Project config (.mditerc, mdite.config.js, package.json#mdite)
    3. User config (~/.config/mdite/config.json)
    4. Built-in defaults
`;

const EXAMPLES = `
EXAMPLES:
  View current merged configuration:
      $ mdite config

  View all available options:
      $ mdite config --schema

  View all available options in JSON:
      $ mdite config --schema --format json

  Get help for specific option:
      $ mdite config --explain maxConcurrency

  See where each value comes from:
      $ mdite config --sources

  Generate comprehensive config template:
      $ mdite config --template > mdite.config.js

  Extract specific value with jq:
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
    .option('--schema', 'Display configuration schema')
    .option('--explain <key>', 'Explain a specific configuration option')
    .option('--sources', 'Show configuration sources/attribution')
    .option('--template', 'Generate comprehensive config template')
    .option('--format <type>', 'Output format (text, json, js, yaml, md)', 'text')
    .option('--output <file>', 'Write template to file (for --template)')
    .addHelpText('after', DESCRIPTION)
    .addHelpText('after', EXAMPLES)
    .addHelpText('after', SEE_ALSO)
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
        // Handle --schema flag
        if (options.schema) {
          await displaySchema(logger, options.format);
          return; // Let process exit naturally instead of calling process.exit()
        }

        // Handle --explain flag
        if (options.explain) {
          await explainOption(options.explain, logger);
          return; // Let process exit naturally instead of calling process.exit()
        }

        // Handle --template flag
        if (options.template) {
          const templateFormat = options.format === 'text' ? 'js' : options.format;
          await generateTemplate(templateFormat, options.output, logger);
          return; // Let process exit naturally instead of calling process.exit()
        }

        // Build CLI options
        const cliOptions: CliOptions = {
          verbose: globalOpts.verbose,
          config: globalOpts.config,
          colors: globalOpts.colors,
        };

        // Load configuration with proper layering
        const configManager = await ConfigManager.load(cliOptions);
        const config = configManager.getConfig();

        // Handle --sources flag
        if (options.sources) {
          await displaySources(configManager, logger, options.format);
          process.exit(ExitCode.SUCCESS);
        }

        // Default: show current configuration
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Display configuration schema
 */
async function displaySchema(logger: Logger, format: string): Promise<void> {
  if (format === 'json') {
    const json = JSON.stringify(buildSchemaJson(), null, 2) + '\n';

    // Handle partial writes and EAGAIN errors when writing to stdout
    // On macOS Node 20.x, writeSync() may:
    // 1. Only write part of the data (up to pipe buffer size, typically 8KB)
    // 2. Throw EAGAIN when stdout is in non-blocking mode and buffer is full
    // Solution: Loop with retry on EAGAIN (standard Unix pattern)
    let offset = 0;
    while (offset < json.length) {
      const chunk = json.substring(offset);
      let bytesWritten = 0;
      let retries = 0;
      const maxRetries = 100;

      // Retry loop for EAGAIN errors
      while (true) {
        try {
          bytesWritten = writeSync(1, chunk);
          break; // Success, exit retry loop
        } catch (err: unknown) {
          const error = err as NodeJS.ErrnoException;
          if (error.code === 'EAGAIN' && retries < maxRetries) {
            retries++;
            // Sleep 10ms using Atomics.wait (synchronous sleep)
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
            continue; // Retry
          }
          throw error; // Non-EAGAIN error or too many retries
        }
      }
      offset += bytesWritten;
    }
  } else {
    displaySchemaText(logger);
  }
}

/**
 * Build JSON schema
 */
function buildSchemaJson(): object {
  const schema: Record<string, unknown> = {};

  for (const [key, metadata] of Object.entries(CONFIG_METADATA)) {
    schema[key] = {
      description: metadata.description,
      longDescription: metadata.longDescription,
      type: metadata.type,
      default: metadata.default,
      examples: metadata.examples,
      category: metadata.category,
      layer: metadata.layer,
      relatedOptions: metadata.relatedOptions,
      validation: metadata.validation,
      whenToChange: metadata.whenToChange,
    };
  }

  return {
    schema,
    layers: CONFIG_LAYERS,
    rules: RULES_METADATA,
  };
}

/**
 * Display schema as formatted text
 */
function displaySchemaText(logger: Logger): void {
  logger.header('mdite Configuration Schema');
  logger.line();

  const grouped = getMetadataByCategory();
  const categories: Array<{ name: string; title: string }> = [
    { name: 'core', title: 'CORE OPTIONS' },
    { name: 'rules', title: 'RULES' },
    { name: 'performance', title: 'PERFORMANCE' },
    { name: 'exclusion', title: 'EXCLUSION' },
    { name: 'scope', title: 'SCOPE LIMITING' },
  ];

  for (const { name, title } of categories) {
    const options = grouped[name as keyof typeof grouped];
    if (Object.keys(options).length === 0) continue;

    logger.info(title);
    logger.log('');

    for (const [key, metadata] of Object.entries(options)) {
      logger.log(`  ${key}`);
      logger.log(`    ${metadata.description}`);
      logger.log(`    Type:    ${metadata.type}`);
      logger.log(`    Default: ${JSON.stringify(metadata.default)}`);
      logger.log(`    Layer:   ${metadata.layer.map(l => capitalize(l)).join(', ')}`);

      if (metadata.examples.length > 0) {
        logger.log(`    Example: ${JSON.stringify(metadata.examples[0])}`);
      }

      logger.log('');
    }
  }

  // Rules section
  if (Object.keys(RULES_METADATA).length > 0) {
    logger.info('Available rules:');
    for (const [rule, ruleMeta] of Object.entries(RULES_METADATA)) {
      logger.log(`  - ${rule}: ${ruleMeta.description}`);
    }
    logger.log('');
  }

  logger.line();
  logger.info('CONFIGURATION LAYERS');
  logger.log('');
  for (const [layer, description] of Object.entries(CONFIG_LAYERS)) {
    logger.log(`  ${capitalize(layer).padEnd(15)} ${description}`);
  }
  logger.log('');

  logger.line();
  logger.info('SEE ALSO');
  logger.log('');
  logger.log('  mdite config --explain <key>  Detailed explanation of specific option');
  logger.log('  mdite config --template       Generate comprehensive config template');
  logger.log('  mdite init                    Create config file in your project');
}

/**
 * Explain a specific configuration option
 */
async function explainOption(key: string, logger: Logger): Promise<void> {
  const metadata = CONFIG_METADATA[key];

  if (!metadata) {
    // Unknown key - show error with suggestions
    const suggestions = fuzzyMatch(key, Object.keys(CONFIG_METADATA));
    logger.error(`Unknown configuration key: ${key}`);

    if (suggestions.length > 0) {
      logger.line();
      logger.info('Did you mean?');
      suggestions.forEach(s => console.error(`  - ${s}`));
    }

    logger.line();
    logger.info(`Run 'mdite config --schema' to see all options`);
    throw new Error('Unknown config key');
  }

  // Display detailed explanation
  logger.header(`mdite Configuration: ${key}`);
  logger.line();

  logger.info('DESCRIPTION');
  logger.log('');
  logger.log(`  ${metadata.longDescription || metadata.description}`);
  logger.log('');

  logger.info('TYPE');
  logger.log('');
  logger.log(`  ${metadata.type}`);
  logger.log('');

  logger.info('DEFAULT');
  logger.log('');
  logger.log(`  ${JSON.stringify(metadata.default)}`);
  logger.log('');

  logger.info('AVAILABLE IN');
  logger.log('');
  logger.log(`  ${metadata.layer.map(l => capitalize(l) + ' config').join(', ')}`);
  logger.log('');

  if (metadata.examples.length > 0) {
    logger.info('EXAMPLES');
    logger.log('');
    metadata.examples.forEach(example => {
      logger.log(`  ${JSON.stringify(example, null, 2)}`);
    });
    logger.log('');
  }

  if (metadata.validation) {
    logger.info('VALIDATION');
    logger.log('');
    logger.log(`  ${metadata.validation}`);
    logger.log('');
  }

  if (metadata.whenToChange) {
    logger.info('WHEN TO CHANGE');
    logger.log('');
    logger.log(`  ${metadata.whenToChange}`);
    logger.log('');
  }

  if (metadata.relatedOptions && metadata.relatedOptions.length > 0) {
    logger.info('RELATED OPTIONS');
    logger.log('');
    metadata.relatedOptions.forEach(opt => {
      logger.log(`  - ${opt}: ${CONFIG_METADATA[opt]?.description || ''}`);
    });
    logger.log('');
  }

  logger.line();
  logger.info('SEE ALSO');
  logger.log('');
  logger.log('  mdite config --schema    View all available options');
  logger.log('  mdite config             View current configuration');
}

/**
 * Generate configuration template
 */
async function generateTemplate(
  format: string,
  outputFile: string | undefined,
  logger: Logger
): Promise<void> {
  let template: string;

  switch (format) {
    case 'js':
      template = buildJavaScriptTemplate();
      break;
    case 'json':
      template = buildJsonTemplate();
      break;
    case 'yaml':
      template = buildYamlTemplate();
      break;
    case 'md':
      template = buildMarkdownTemplate();
      break;
    default:
      logger.error(`Invalid format: ${format}. Must be js, json, yaml, or md`);
      process.exit(ExitCode.USAGE_ERROR);
  }

  if (outputFile) {
    // Write to file
    const fs = await import('fs/promises');
    const path = await import('path');
    const resolvedPath = path.resolve(outputFile);

    // Check if file exists
    try {
      await fs.access(resolvedPath);
      logger.error(`File already exists: ${resolvedPath}`);
      process.exit(ExitCode.USAGE_ERROR);
    } catch {
      // File doesn't exist, good to proceed
    }

    await fs.writeFile(resolvedPath, template, 'utf-8');
    logger.success(`Template written to: ${resolvedPath}`);
  } else {
    // Output to stdout
    console.log(template);
  }
}

/**
 * Build JavaScript template
 */
function buildJavaScriptTemplate(): string {
  const grouped = getMetadataByCategory();
  const lines: string[] = [];

  lines.push('module.exports = {');
  lines.push('  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('  // mdite Configuration');
  lines.push('  // Docs: https://github.com/radleta/mdite#configuration');
  lines.push('  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  const categories: Array<{ name: string; title: string; showUncommented: string[] }> = [
    { name: 'core', title: 'CORE OPTIONS', showUncommented: ['entrypoint'] },
    { name: 'rules', title: 'RULES', showUncommented: ['rules'] },
    { name: 'performance', title: 'PERFORMANCE', showUncommented: [] },
    { name: 'exclusion', title: 'EXCLUSION', showUncommented: [] },
    { name: 'scope', title: 'SCOPE LIMITING', showUncommented: [] },
  ];

  for (const { name, title, showUncommented } of categories) {
    const options = grouped[name as keyof typeof grouped];
    if (Object.keys(options).length === 0) continue;

    lines.push('  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`  // ${title}`);
    lines.push('  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');

    for (const [key, metadata] of Object.entries(options)) {
      const commented = !showUncommented.includes(key);
      const prefix = commented ? '  // ' : '  ';

      // Add description
      lines.push(`  // ${metadata.description}`);
      if (metadata.type) {
        lines.push(`  // Type: ${metadata.type}`);
      }
      if (metadata.validation) {
        lines.push(`  // ${metadata.validation}`);
      }

      // Add value
      if (key === 'rules' && typeof metadata.default === 'object') {
        lines.push(`${prefix}${key}: {`);
        const rules = metadata.default as Record<string, string>;
        for (const [rule, severity] of Object.entries(rules)) {
          const ruleDesc = RULES_METADATA[rule]?.description || '';
          lines.push(`${prefix}  '${rule}': '${severity}',  // ${ruleDesc}`);
        }
        lines.push(`${prefix}},`);
      } else {
        const value = JSON.stringify(metadata.default);
        lines.push(`${prefix}${key}: ${value},`);
      }
      lines.push('');
    }
  }

  lines.push("  // Run 'mdite config --schema' to see all options");
  lines.push("  // Run 'mdite config --explain <key>' for details");
  lines.push('};');

  return lines.join('\n');
}

/**
 * Build JSON template
 */
function buildJsonTemplate(): string {
  const config: Record<string, unknown> = {
    $schema: 'https://mdite.dev/schema.json',
    entrypoint: 'README.md',
    rules: {
      'orphan-files': 'error',
      'dead-link': 'error',
      'dead-anchor': 'error',
    },
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Build YAML template
 */
function buildYamlTemplate(): string {
  const lines: string[] = [];
  lines.push('# mdite Configuration');
  lines.push('# Docs: https://github.com/radleta/mdite#configuration');
  lines.push('');
  lines.push('# Entry point for documentation graph traversal');
  lines.push('entrypoint: README.md');
  lines.push('');
  lines.push('# Validation rules (error | warn | off)');
  lines.push('rules:');
  lines.push('  orphan-files: error  # Files not linked from entrypoint');
  lines.push('  dead-link: error     # Broken file links');
  lines.push('  dead-anchor: error   # Broken heading anchors');
  lines.push('');
  lines.push('# Optional configuration');
  lines.push('# depth: unlimited');
  lines.push('# exclude: []');
  lines.push('# maxConcurrency: 10');
  return lines.join('\n');
}

/**
 * Build Markdown template
 */
function buildMarkdownTemplate(): string {
  const lines: string[] = [];
  lines.push('# mdite Configuration Reference');
  lines.push('');

  const grouped = getMetadataByCategory();
  const categories: Array<{ name: string; title: string }> = [
    { name: 'core', title: 'Core Options' },
    { name: 'rules', title: 'Rules' },
    { name: 'performance', title: 'Performance' },
    { name: 'exclusion', title: 'Exclusion' },
    { name: 'scope', title: 'Scope Limiting' },
  ];

  for (const { name, title } of categories) {
    const options = grouped[name as keyof typeof grouped];
    if (Object.keys(options).length === 0) continue;

    lines.push(`## ${title}`);
    lines.push('');

    for (const [key, metadata] of Object.entries(options)) {
      lines.push(`### ${key}`);
      lines.push('');
      lines.push(`- **Type**: ${metadata.type}`);
      lines.push(`- **Default**: \`${JSON.stringify(metadata.default)}\``);
      lines.push(`- **Description**: ${metadata.description}`);
      lines.push('');

      if (metadata.examples.length > 0) {
        lines.push('**Examples**:');
        lines.push('```javascript');
        lines.push(`${key}: ${JSON.stringify(metadata.examples[0], null, 2)}`);
        lines.push('```');
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

/**
 * Display configuration sources
 */
async function displaySources(
  _configManager: ConfigManager,
  logger: Logger,
  format: string
): Promise<void> {
  if (format === 'json') {
    // For now, just show a placeholder
    // Full implementation would require enhancing ConfigManager to track sources
    console.log(
      JSON.stringify(
        {
          message: 'Source tracking not yet fully implemented',
          tip: 'Use --schema to see available options',
        },
        null,
        2
      )
    );
  } else {
    logger.header('mdite Configuration Sources');
    logger.line();
    logger.info('MERGED CONFIGURATION');
    logger.log('');
    logger.log('  Note: Full source tracking will be implemented in Phase 2');
    logger.log('  Use --schema to see all available options');
    logger.log('');
  }
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
