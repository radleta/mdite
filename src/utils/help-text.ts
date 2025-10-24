/**
 * Shared help text sections used across CLI commands
 *
 * This module contains only truly shared content (exit codes, environment
 * variables, config precedence) that is identical across all commands.
 *
 * Command-specific help text (descriptions, examples, output notes) lives
 * colocated with each command for easier maintenance.
 */

export const EXIT_CODES = `
EXIT CODES:
  0    Success (no validation errors)
  1    Validation errors (orphans, broken links)
  2    Usage errors (invalid arguments)
  130  Interrupted (SIGINT, SIGTERM)
`;

export const ENVIRONMENT_VARS = `
ENVIRONMENT:
  NO_COLOR        Disable colored output (respects no-color.org standard)
  FORCE_COLOR     Force colored output even when piped
  CI=true         Auto-disable colors in CI environments
`;

export const CONFIG_PRECEDENCE = `
CONFIGURATION:
  Config files loaded in priority order:
    1. CLI flags (--entrypoint, --format, etc.)
    2. Project config (.mditerc, mdite.config.js, package.json#mdite)
    3. User config (~/.config/mdite/config.json)
    4. Built-in defaults

  See: mdite init --help
       mdite config --help
`;

export const MAIN_DESCRIPTION = `
DESCRIPTION:
  mdite treats your markdown documentation as a connected system (graph),
  not isolated files. This enables system-wide operations: validation,
  dependency analysis, file listing, and content output.

  Key concepts:
    - Documentation graph: files (nodes) connected by links (edges)
    - Entrypoint: starting file (default: README.md) at depth 0
    - Reachability: files discoverable by following links from entrypoint
    - Orphans: files not reachable from entrypoint

  Common workflows:
    1. Validate: mdite lint
    2. Analyze: mdite deps <file>
    3. Search: mdite files | xargs rg "pattern"
    4. Export: mdite cat | pandoc -o docs.pdf
`;

export const MAIN_EXAMPLES = `
EXAMPLES:
  Validate your documentation:
      $ mdite lint

  Understand dependencies before refactoring:
      $ mdite deps docs/api.md --incoming

  List all reachable files and search:
      $ mdite files | xargs rg "authentication"

  Export documentation in dependency order:
      $ mdite cat --order deps | pandoc -o docs.pdf

  Initialize configuration:
      $ mdite init
`;
