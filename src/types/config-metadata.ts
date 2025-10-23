/**
 * Configuration metadata system
 *
 * Single source of truth for all configuration documentation.
 * Used by --schema, --explain, --template, and help text.
 */

export type ConfigCategory = 'core' | 'rules' | 'performance' | 'exclusion' | 'scope';

export type ConfigLayer = 'defaults' | 'user' | 'project' | 'cli';

export interface ConfigMetadata {
  /** Short description of the option */
  description: string;
  /** Detailed explanation (for --explain) */
  longDescription?: string;
  /** Type signature */
  type: string;
  /** Default value */
  default: unknown;
  /** Example values */
  examples: unknown[];
  /** Category for grouping */
  category: ConfigCategory;
  /** Which config layers support this option */
  layer: ConfigLayer[];
  /** Related configuration options */
  relatedOptions?: string[];
  /** Validation rules/constraints */
  validation?: string;
  /** When users should change this option */
  whenToChange?: string;
  /** Common use cases */
  commonUseCase?: string;
}

export const CONFIG_METADATA: Record<string, ConfigMetadata> = {
  entrypoint: {
    description: 'Entry point file for documentation graph traversal',
    longDescription:
      'The markdown file where mdite starts building the dependency graph. ' +
      'All reachable files are found by following links from this file. ' +
      'Files not linked (directly or indirectly) from the entrypoint are considered orphans.',
    type: 'string',
    default: 'README.md',
    examples: ['README.md', 'docs/index.md', 'documentation/start.md'],
    category: 'core',
    layer: ['project', 'user', 'cli'],
    relatedOptions: ['depth', 'scopeRoot'],
    validation: 'Must be a markdown file (.md) that exists in your project',
    whenToChange:
      'Change when your main documentation entry is not README.md, ' +
      'such as docs sites with docs/index.md as the starting point',
    commonUseCase: 'Multi-repo docs with custom entry point structure',
  },

  depth: {
    description: 'Maximum depth for graph traversal',
    longDescription:
      'Controls how many levels of links mdite follows from the entrypoint. ' +
      'depth=0 means only entrypoint, depth=1 includes direct links, depth=2 includes ' +
      'links from those files, and so on. Use "unlimited" to traverse all reachable files.',
    type: 'number | "unlimited"',
    default: 'unlimited',
    examples: [3, 5, 10, 'unlimited'],
    category: 'core',
    layer: ['project', 'user', 'cli'],
    relatedOptions: ['entrypoint', 'scopeLimit'],
    validation: 'Must be non-negative integer or the string "unlimited"',
    whenToChange:
      'Limit depth for: (1) Progressive validation of large doc sets, ' +
      '(2) Performance optimization, (3) Focused validation of core docs only',
    commonUseCase: 'Large doc repos where you want to validate core docs first',
  },

  format: {
    description: 'Output format for lint results',
    longDescription:
      'Controls the output format for validation results. "text" provides human-readable ' +
      'colored output for terminals. "json" provides machine-readable output for CI/CD ' +
      'pipelines and tool integration.',
    type: '"text" | "json"',
    default: 'text',
    examples: ['text', 'json'],
    category: 'core',
    layer: ['user', 'cli'],
    validation: 'Must be "text" or "json"',
    whenToChange: 'Use "json" for: CI/CD pipelines, tool integration, programmatic parsing',
    commonUseCase: 'Automated workflows that need to parse validation results',
  },

  colors: {
    description: 'Enable colored terminal output',
    longDescription:
      'Controls whether mdite uses ANSI color codes in output. Auto-detected based on ' +
      'TTY status by default. Can be overridden with --colors or --no-colors flags, or ' +
      'by setting NO_COLOR or FORCE_COLOR environment variables.',
    type: 'boolean',
    default: true,
    examples: [true, false],
    category: 'core',
    layer: ['user', 'cli'],
    validation: 'Must be boolean',
    whenToChange: 'Disable for: Piped output, log files, environments without color support',
    commonUseCase: 'CI/CD systems or when redirecting output to files',
  },

  verbose: {
    description: 'Enable verbose logging',
    longDescription:
      'When enabled, mdite outputs detailed information about operations including ' +
      'graph building progress, file processing, and internal operations. Useful for ' +
      'debugging and understanding how mdite processes your documentation.',
    type: 'boolean',
    default: false,
    examples: [true, false],
    category: 'core',
    layer: ['user', 'cli'],
    validation: 'Must be boolean',
    whenToChange: 'Enable for: Debugging, understanding graph building, troubleshooting issues',
    commonUseCase: 'Debugging configuration issues or understanding validation behavior',
  },

  maxConcurrency: {
    description: 'Maximum number of concurrent file validations',
    longDescription:
      'Controls how many files can be validated in parallel during link checking. ' +
      'Higher values improve performance on multi-core systems but consume more resources. ' +
      'Lower values reduce resource usage but may be slower.',
    type: 'number (1-100)',
    default: 10,
    examples: [5, 10, 20, 50],
    category: 'performance',
    layer: ['project'],
    relatedOptions: ['depth'],
    validation: 'Must be integer between 1 and 100',
    whenToChange:
      'Increase (15-50): Multi-core systems, large doc sets (100+ files). ' +
      'Decrease (3-8): Limited resources, slower systems, avoid file system overload',
    commonUseCase: 'Tuning performance for large documentation sets or CI environments',
  },

  rules: {
    description: 'Rule configuration with severity levels',
    longDescription:
      'Configure severity for validation rules. Each rule can be: ' +
      '"error" (fail build), "warn" (show warning), or "off" (disabled). ' +
      'Available rules: orphan-files (unreachable files), dead-link (broken file links), ' +
      'dead-anchor (broken heading anchors).',
    type: 'Record<string, "error" | "warn" | "off">',
    default: {
      'orphan-files': 'error',
      'dead-link': 'error',
      'dead-anchor': 'error',
    },
    examples: [
      { 'orphan-files': 'warn', 'dead-link': 'error', 'dead-anchor': 'off' },
      { 'orphan-files': 'error', 'dead-link': 'error', 'dead-anchor': 'warn' },
    ],
    category: 'rules',
    layer: ['project', 'user'],
    validation: 'Each rule must have severity: "error", "warn", or "off"',
    whenToChange: 'Customize based on: Project maturity, documentation standards, team preferences',
    commonUseCase: 'Adjusting strictness during migration or for work-in-progress docs',
  },

  exclude: {
    description: 'Glob patterns to exclude (gitignore-style)',
    longDescription:
      'Exclude files or directories from validation using gitignore-style patterns. ' +
      'Supports wildcards (*), directory matching (**), and negation (!). ' +
      'Patterns are matched against file paths relative to the project root.',
    type: 'string[]',
    default: [],
    examples: [
      ['drafts/**', '*.temp.md'],
      ['archive/*.md', '!archive/important.md'],
      ['wip/**', 'scratch/**'],
    ],
    category: 'exclusion',
    layer: ['project', 'cli'],
    relatedOptions: ['respectGitignore', 'excludeHidden', 'validateExcludedLinks'],
    validation: 'Each pattern must be non-empty string',
    whenToChange:
      'Use to: Exclude work-in-progress docs, temporary files, generated files, archives',
    commonUseCase: 'Excluding drafts, old documentation, or generated content',
  },

  respectGitignore: {
    description: 'Respect .gitignore patterns',
    longDescription:
      'When enabled, mdite will automatically exclude files and directories that are ' +
      'ignored by git according to your .gitignore file. Useful if your .gitignore ' +
      'already excludes documentation you want to skip.',
    type: 'boolean',
    default: false,
    examples: [true, false],
    category: 'exclusion',
    layer: ['project', 'cli'],
    relatedOptions: ['exclude', 'excludeHidden'],
    validation: 'Must be boolean',
    whenToChange:
      'Enable when: Your .gitignore already excludes docs you want to skip from validation',
    commonUseCase: 'Projects where .gitignore already handles doc exclusions',
  },

  excludeHidden: {
    description: 'Exclude hidden directories',
    longDescription:
      'When enabled (default), mdite skips hidden directories (starting with .) like ' +
      '.git, .github, .config, etc. Disable only if you have documentation in hidden ' +
      'directories that should be validated.',
    type: 'boolean',
    default: true,
    examples: [true, false],
    category: 'exclusion',
    layer: ['project', 'cli'],
    relatedOptions: ['exclude', 'respectGitignore'],
    validation: 'Must be boolean',
    whenToChange: 'Disable when: You have documentation in hidden directories (rare use case)',
    commonUseCase: 'Usually left as default; rarely disabled',
  },

  validateExcludedLinks: {
    description: 'How to handle links to excluded files',
    longDescription:
      'Controls validation behavior for links pointing to files that are excluded. ' +
      '"ignore" skips validation, "warn" validates and shows warning, ' +
      '"error" treats as validation error.',
    type: '"ignore" | "warn" | "error"',
    default: 'ignore',
    examples: ['ignore', 'warn', 'error'],
    category: 'exclusion',
    layer: ['project', 'cli'],
    relatedOptions: ['exclude'],
    validation: 'Must be "ignore", "warn", or "error"',
    whenToChange: 'Use "warn" or "error" when: Links to excluded files should be flagged as issues',
    commonUseCase: 'Ensuring documentation does not link to excluded/draft content',
  },

  scopeLimit: {
    description: 'Enable scope limiting',
    longDescription:
      'When enabled (default), graph traversal stays within the scope directory ' +
      '(determined from entrypoint or scopeRoot). Links outside scope are ' +
      'validated but not traversed. Prevents mdite from following links to ' +
      'documentation outside your main docs directory.',
    type: 'boolean',
    default: true,
    examples: [true, false],
    category: 'scope',
    layer: ['project', 'cli'],
    relatedOptions: ['scopeRoot', 'externalLinks'],
    validation: 'Must be boolean',
    whenToChange: 'Disable when: You want unlimited traversal across your entire repository',
    commonUseCase: 'Keep enabled to focus validation on your main docs directory',
  },

  scopeRoot: {
    description: 'Explicit scope root directory',
    longDescription:
      'Override the auto-detected scope boundary. Path is relative to config file. ' +
      'When not set, scope is auto-detected from entrypoint directory. Use this to ' +
      'explicitly control which directory tree is validated.',
    type: 'string',
    default: undefined,
    examples: ['docs/', 'documentation/', 'wiki/'],
    category: 'scope',
    layer: ['project', 'cli'],
    relatedOptions: ['scopeLimit', 'externalLinks'],
    validation: 'Must be a directory path relative to config file',
    whenToChange:
      'Set when: Scope should differ from entrypoint directory, ' +
      'or when using multi-file validation with different scopes',
    commonUseCase: 'Multi-directory documentation with specific validation scope',
  },

  externalLinks: {
    description: 'Policy for handling links outside scope',
    longDescription:
      'Controls how links pointing outside the scope boundary are handled. ' +
      '"validate" checks file exists but does not traverse, "warn" validates with warning, ' +
      '"error" treats as error, "ignore" skips validation entirely.',
    type: '"validate" | "warn" | "error" | "ignore"',
    default: 'validate',
    examples: ['validate', 'warn', 'error', 'ignore'],
    category: 'scope',
    layer: ['project', 'cli'],
    relatedOptions: ['scopeLimit', 'scopeRoot'],
    validation: 'Must be "validate", "warn", "error", or "ignore"',
    whenToChange:
      'Use "warn" or "error": When external links should be discouraged. ' +
      'Use "ignore": When external links are intentional and should be skipped',
    commonUseCase: 'Enforcing documentation boundaries or allowing cross-directory links',
  },
};

// Available rules documentation
export const RULES_METADATA: Record<
  string,
  {
    description: string;
    impact: string;
    whenToDisable: string;
  }
> = {
  'orphan-files': {
    description: 'Detect files not reachable from entrypoint',
    impact: 'Files that exist but are not linked are considered orphaned',
    whenToDisable: 'Disable if you intentionally have disconnected documentation',
  },
  'dead-link': {
    description: 'Detect broken file links',
    impact: 'Links to non-existent markdown files will cause errors',
    whenToDisable: 'Never - broken links should always be fixed',
  },
  'dead-anchor': {
    description: 'Detect broken anchor/heading references',
    impact: 'Links to non-existent headings (e.g., #section) will cause errors',
    whenToDisable: 'Set to "warn" during active development with changing headings',
  },
};

// Layer descriptions
export const CONFIG_LAYERS: Record<ConfigLayer, string> = {
  cli: 'Highest priority, passed as command-line options',
  project: '.mditerc, mdite.config.js, package.json#mdite',
  user: '~/.config/mdite/config.json (personal defaults)',
  defaults: 'Built-in defaults',
};

/**
 * Get metadata grouped by category
 */
export function getMetadataByCategory(): Record<ConfigCategory, Record<string, ConfigMetadata>> {
  const grouped: Record<ConfigCategory, Record<string, ConfigMetadata>> = {
    core: {},
    rules: {},
    performance: {},
    exclusion: {},
    scope: {},
  };

  for (const [key, metadata] of Object.entries(CONFIG_METADATA)) {
    grouped[metadata.category][key] = metadata;
  }

  return grouped;
}

/**
 * Simple fuzzy matching for typo suggestions
 * Uses Levenshtein distance
 */
export function fuzzyMatch(input: string, candidates: string[], maxSuggestions = 3): string[] {
  const distances = candidates.map(candidate => ({
    candidate,
    distance: levenshteinDistance(input.toLowerCase(), candidate.toLowerCase()),
  }));

  // Sort by distance and filter for reasonable matches (distance <= 3)
  return distances
    .filter(d => d.distance <= 3)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxSuggestions)
    .map(d => d.candidate);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    if (matrix[0]) {
      matrix[0][j] = j;
    }
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      const row = matrix[i];
      const prevRow = matrix[i - 1];

      if (!row || !prevRow) continue;

      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        row[j] = prevRow[j - 1] ?? 0;
      } else {
        row[j] = Math.min(
          (prevRow[j - 1] ?? 0) + 1, // substitution
          (row[j - 1] ?? 0) + 1, // insertion
          (prevRow[j] ?? 0) + 1 // deletion
        );
      }
    }
  }

  const lastRow = matrix[str2.length];
  return lastRow?.[str1.length] ?? 0;
}
