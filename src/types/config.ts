import { z } from 'zod';

/**
 * Severity level for linting rules
 *
 * - `error`: Rule violations will cause lint to fail (exit code 1)
 * - `warn`: Rule violations will be reported but won't fail
 * - `off`: Rule is disabled
 *
 * @example
 * ```typescript
 * const rules = {
 *   'dead-link': 'error' as Severity,
 *   'orphan-files': 'warn' as Severity,
 *   'unused-rule': 'off' as Severity
 * };
 * ```
 */
export const SeveritySchema = z.enum(['error', 'warn', 'off']);
export type Severity = z.infer<typeof SeveritySchema>;

/**
 * User-level configuration schema
 *
 * User configuration is stored in `~/.config/mdite/config.json` and provides
 * personal defaults that apply across all projects.
 *
 * @example
 * ```typescript
 * // ~/.config/mdite/config.json
 * {
 *   "defaultEntrypoint": "docs/README.md",
 *   "defaultFormat": "json",
 *   "colors": true,
 *   "verbose": false,
 *   "rules": {
 *     "orphan-files": "warn"
 *   }
 * }
 * ```
 */
export const UserConfigSchema = z.object({
  /** Default entrypoint for all projects */
  defaultEntrypoint: z.string().optional(),
  /** Default output format for lint results */
  defaultFormat: z.enum(['text', 'json']).optional(),
  /** Enable colored terminal output */
  colors: z.boolean().default(true),
  /** Enable verbose logging */
  verbose: z.boolean().default(false),
  /** Default depth for graph traversal */
  defaultDepth: z.union([z.number().int().min(0), z.literal('unlimited')]).optional(),
  /** Default rule severities */
  rules: z.record(z.string(), SeveritySchema).optional(),
});

export type UserConfig = z.infer<typeof UserConfigSchema>;

/**
 * Project-level configuration schema
 *
 * Project configuration is defined in `mdite.config.js`, `.mditerc`, or
 * the `mdite` field in `package.json`. These settings override user config
 * and apply to the specific project.
 *
 * @example
 * ```typescript
 * // mdite.config.js
 * export default {
 *   entrypoint: 'docs/README.md',
 *   rules: {
 *     'orphan-files': 'error',
 *     'dead-link': 'error',
 *     'dead-anchor': 'warn'
 *   },
 *   exclude: ['drafts/**', '*.temp.md'],
 *   respectGitignore: false,
 *   excludeHidden: true
 * };
 * ```
 */
export const ProjectConfigSchema = z.object({
  /** Entry point file for documentation graph traversal */
  entrypoint: z.string().optional(),
  /** Maximum depth for graph traversal */
  depth: z.union([z.number().int().min(0), z.literal('unlimited')]).optional(),
  /** Maximum number of concurrent file validations */
  maxConcurrency: z.number().int().min(1).max(100).optional(),
  /** Rule configuration with severity levels */
  rules: z.record(z.string(), SeveritySchema).optional(),
  /** Configuration files to extend (not yet implemented) */
  extends: z.array(z.string()).optional(),
  /** Glob patterns to exclude (gitignore-style) */
  exclude: z.array(z.string().min(1)).optional(),
  /** Respect .gitignore patterns */
  respectGitignore: z.boolean().optional(),
  /** Exclude hidden directories (default: true) */
  excludeHidden: z.boolean().optional(),
  /** How to handle links to excluded files */
  validateExcludedLinks: z.enum(['ignore', 'warn', 'error']).optional(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

/**
 * Runtime configuration schema
 *
 * This is the final merged configuration used during execution,
 * combining defaults, user config, project config, and CLI options.
 *
 * Configuration priority (highest to lowest):
 * 1. CLI options
 * 2. Project config
 * 3. User config
 * 4. Defaults
 *
 * @example
 * ```typescript
 * const config: RuntimeConfig = {
 *   entrypoint: 'README.md',
 *   format: 'text',
 *   colors: true,
 *   verbose: false,
 *   rules: {
 *     'orphan-files': 'error',
 *     'dead-link': 'error',
 *     'dead-anchor': 'error'
 *   },
 *   exclude: [],
 *   respectGitignore: false,
 *   excludeHidden: true,
 *   validateExcludedLinks: 'ignore'
 * };
 * ```
 */
export const RuntimeConfigSchema = z.object({
  /** Entry point file for documentation graph traversal */
  entrypoint: z.string(),
  /** Output format for lint results */
  format: z.enum(['text', 'json']),
  /** Enable colored terminal output */
  colors: z.boolean(),
  /** Enable verbose logging */
  verbose: z.boolean(),
  /** Maximum depth for graph traversal */
  depth: z.union([z.number().int().min(0), z.literal('unlimited')]),
  /** Maximum number of concurrent file validations */
  maxConcurrency: z.number().int().min(1).max(100),
  /** Rule configuration with severity levels */
  rules: z.record(z.string(), SeveritySchema),
  /** Glob patterns to exclude (gitignore-style) */
  exclude: z.array(z.string()),
  /** Respect .gitignore patterns */
  respectGitignore: z.boolean(),
  /** Exclude hidden directories */
  excludeHidden: z.boolean(),
  /** How to handle links to excluded files */
  validateExcludedLinks: z.enum(['ignore', 'warn', 'error']),
  /** CLI-level exclusion patterns (highest priority) */
  cliExclude: z.array(z.string()).optional(),
});

export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;

/**
 * Command-line interface options
 *
 * These options can be passed via CLI flags and have the highest priority,
 * overriding all other configuration sources.
 *
 * @example
 * ```typescript
 * const cliOptions: CliOptions = {
 *   entrypoint: 'docs/README.md',
 *   format: 'json',
 *   colors: false,
 *   verbose: true,
 *   config: './custom-config.json',
 *   exclude: ['drafts/**', '*.temp.md'],
 *   respectGitignore: true
 * };
 * ```
 */
export interface CliOptions {
  /** Entry point file path */
  entrypoint?: string;
  /** Output format */
  format?: 'text' | 'json';
  /** Enable colored output */
  colors?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Maximum depth for graph traversal */
  depth?: number | 'unlimited';
  /** Path to explicit config file */
  config?: string;
  /** Exclusion patterns from CLI */
  exclude?: string[];
  /** Respect .gitignore file */
  respectGitignore?: boolean;
  /** Exclude hidden directories */
  excludeHidden?: boolean;
  /** How to handle links to excluded files */
  validateExcludedLinks?: 'ignore' | 'warn' | 'error';
}

/**
 * Default configuration values
 *
 * These values are used when no other configuration is provided.
 * All other configuration layers override these defaults.
 *
 * @example
 * ```typescript
 * import { DEFAULT_CONFIG } from './config.js';
 *
 * const config = { ...DEFAULT_CONFIG, verbose: true };
 * ```
 */
export const DEFAULT_CONFIG: RuntimeConfig = {
  entrypoint: 'README.md',
  format: 'text',
  colors: true,
  verbose: false,
  depth: 'unlimited',
  maxConcurrency: 10,
  rules: {
    'orphan-files': 'error',
    'dead-link': 'error',
    'dead-anchor': 'error',
  },
  exclude: [],
  respectGitignore: false,
  excludeHidden: true,
  validateExcludedLinks: 'ignore',
};

/**
 * Legacy type alias for backward compatibility
 * @deprecated Use ProjectConfigSchema instead
 */
export const DocLintConfigSchema = ProjectConfigSchema;

/**
 * Legacy type alias for backward compatibility
 * @deprecated Use ProjectConfig instead
 */
export type DocLintConfig = ProjectConfig;
