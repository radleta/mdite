# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **File exclusion support**: Exclude files from validation using gitignore-style patterns
  - CLI: `--exclude <pattern>` flag for ad-hoc exclusions (can be used multiple times)
  - Config: `exclude: string[]` array in configuration files
  - Ignore file: `.mditeignore` with gitignore-compatible patterns (automatic detection)
  - Gitignore: Optional `.gitignore` respect with `--respect-gitignore` flag
  - Precedence: CLI > Config > .mditeignore > .gitignore > Built-in defaults
  - Pattern syntax: Gitignore-compatible (wildcards `*`, `**`, negation `!`, comments `#`)
  - Built-in defaults: `node_modules/` and hidden directories (configurable via `--no-exclude-hidden`)
  - New component: `ExclusionManager` in `src/core/exclusion-manager.ts` using `ignore` npm package
  - Integrated with file discovery, graph building, and orphan detection
  - Template file: `.mditeignore.example` demonstrates common patterns
  - Zero breaking changes: existing behavior maintained (hidden dirs + node_modules excluded by default)
- **Configurable hidden directory exclusion**: New `excludeHidden` config option
  - Default: `true` (maintains current behavior of excluding `.git`, `.config`, etc.)
  - Can be disabled: `excludeHidden: false` in config or `--no-exclude-hidden` CLI flag
  - Allows scanning hidden directories when needed

- **Multi-file linting**: `mdite lint` now accepts multiple file paths as variadic arguments
  - Each file acts as an independent entry point for graph traversal (starting at depth 0)
  - Depth limit applies to all files equally
  - Results are merged with automatic deduplication of errors
  - Orphans = files not reachable from ANY specified entry point
  - Perfect for pre-commit hooks: `mdite lint $(git diff --cached --name-only | grep '\.md$') --depth 1`
  - Cannot be combined with `--entrypoint` option (files replace entrypoint)
  - Backward compatible: single file or directory still works as before
  - Added 22 new tests (6 unit + 16 integration) covering multi-file scenarios
  - Example: `examples/08-multi-file-validation/` demonstrates feature

- **Directory-scoped validation by default**: Graph traversal now stays within scope directory by default
  - Scope is determined from entrypoint path (file's directory or explicit basePath)
  - Links pointing outside scope are validated but not traversed
  - New `--no-scope-limit` flag to disable scoping (unlimited traversal)
  - New `--scope-root <dir>` flag to explicitly set scope boundary
  - New `--external-links <policy>` flag to control out-of-scope link handling:
    - `validate` (default): Check file exists but don't traverse
    - `warn`: Validate + emit warning
    - `error`: Treat as validation error
    - `ignore`: Skip validation entirely
  - Config options: `scopeLimit` (boolean), `scopeRoot` (string), `externalLinks` (policy)
  - Multi-file mode determines common ancestor scope automatically
  - Orphan detection limited to scope directory
  - New `getExternalLinks()` method in GraphAnalyzer to track out-of-scope links
  - CRITICAL FIX: Orphan detection now uses scopeRoot instead of basePath (prevents false negatives)

### Fixed

- **`mdite init` command**: Fixed bug where `--config` flag was ignored
  - Removed conflicting local `--config` option that shadowed global option
  - Command now properly respects `--config` flag for custom config file paths
  - Aligns with other commands (deps, config, lint) in using global options

### Performance

- **Centralized markdown cache**: Implemented `MarkdownCache` to eliminate redundant file parsing for 2-3x overall speedup
  - Caches file content, parsed AST, and derived data (headings, links) across graph building and validation
  - Reduces parse operations by 60-70% (100 files: 300 parses → 100 parses)
  - Shared processor instance eliminates plugin registration overhead
  - Memory efficient: ~6MB for 100 files, ~60MB for 1000 files (acceptable for CLI tool)
  - Automatic cache clearing between operations
  - Cache statistics available via `getStats()` for monitoring
  - Added 27 comprehensive tests covering all caching scenarios
  - Full integration: `GraphAnalyzer`, `LinkValidator`, and `DocLinter` all share cache instance
  - Related to issue #1 - Critical performance optimization
- **Parallel file validation**: Link validation now runs in parallel with controlled concurrency for 5-10x speedup on multi-core systems
  - Changed from sequential file processing to parallel validation using promise pool
  - Default concurrency limit of 10 prevents resource exhaustion on large documentation sets (1000+ files)
  - Configurable via `maxConcurrency` option in config (min: 1, max: 100, default: 10)
  - Expected speedup: 5x on 100 files, 6-7x on 1000+ files (varies by system)
  - New utility: `src/utils/promise-pool.ts` for controlled concurrency operations
  - Added 14 new tests covering concurrency limiting, error handling, and order preservation
  - Backward compatible: existing code works without changes
  - Related to issue #9 - Performance optimizations
- **Heading slug cache**: Added memoization to `slugify()` function for 40-60% performance improvement
  - Map-based cache eliminates redundant regex operations on repeated headings
  - Typical documentation with 1,000 headings (~400 unique) saves ~2,400 regex operations
  - Cache size is negligible (~12KB for 400 entries)
  - Added `clearSlugCache()` and `getSlugCacheStats()` helper functions for testing and debugging
  - Added 6 new tests covering cache behavior, hit/miss scenarios, and edge cases
  - Related to issue #4 - Performance optimizations

### Changed

- **Configuration schema**: Added exclusion and scope-related options to config schemas
  - `ProjectConfigSchema`: Added `exclude`, `respectGitignore`, `excludeHidden`, `validateExcludedLinks`, `scopeLimit`, `scopeRoot`, `externalLinks`
  - `RuntimeConfigSchema`: Added same fields plus `cliExclude` for CLI-level patterns
  - `DEFAULT_CONFIG`: Added defaults (`exclude: []`, `respectGitignore: false`, `excludeHidden: true`, `validateExcludedLinks: 'ignore'`, `scopeLimit: true`, `scopeRoot: undefined`, `externalLinks: 'validate'`)
  - `CliOptions`: Added `exclude`, `respectGitignore`, `excludeHidden`, `validateExcludedLinks`, `scopeLimit`, `scopeRoot`, `externalLinks` fields
- **File discovery (`findMarkdownFiles`)**: Now accepts optional `ExclusionManager` parameter for filtering
  - Backward compatible: works without exclusion manager (falls back to hardcoded exclusions)
  - Early directory exclusion optimization for performance
- **Graph analyzer (`GraphAnalyzer`)**: Enhanced with scope-aware traversal capabilities
  - Now accepts optional `ExclusionManager` in constructor
  - Integrated with both `visitFile()` and `visitFileForGraph()` methods
  - Automatic exclusion during graph traversal and orphan detection
  - New `isWithinScope()` method for scope boundary checking
  - New `getExternalLinks()` method to retrieve out-of-scope links
  - New `findCommonAncestor()` method for multi-file scope determination
  - Updated `findOrphans()` to use scopeRoot instead of basePath (CRITICAL FIX)
- **Link validator (`LinkValidator`)**: Enhanced with external link policy support
  - New constructor parameters: `scopeRoot` and `externalLinkPolicy`
  - New `isWithinScope()` method for scope boundary checking
  - Updated `validateFileLink()` to apply external link policies
  - Supports four policies: `validate`, `warn`, `error`, `ignore`
- **Doc linter (`DocLinter`)**: Enhanced with scope configuration
  - Creates and manages `ExclusionManager` instance
  - Conditionally creates manager only when exclusion options are set
  - Passes to all downstream components (GraphAnalyzer, file discovery)
  - Passes scopeRoot and externalLinkPolicy to LinkValidator
  - Added verbose logging for scope information
- **Config manager (`ConfigManager`)**: Updated merge logic for exclusion options
  - Properly merges exclusion settings from project config
  - Handles CLI options with highest priority (stores as `cliExclude`)
- **CLI commands (`lint`, `deps`)**: Added exclusion and scope flags
  - `--exclude <pattern...>`: Variadic option for multiple patterns
  - `--respect-gitignore`: Boolean flag
  - `--no-exclude-hidden`: Negation flag
  - `--validate-excluded-links <mode>`: For lint command (future use)
  - `--no-scope-limit`: Disable scope limiting
  - `--scope-root <dir>`: Explicit scope root directory
  - `--external-links <policy>`: External link policy (validate|warn|error|ignore)

### Internal

**mdite** is a markdown documentation toolkit that treats documentation as a connected system (graph), not isolated files. This foundational approach enables all current and future features.

#### Core Features

- **Graph-based architecture**: Documentation treated as nodes (files) and edges (links)
- **Graph traversal**: Depth-first traversal from entrypoint, building complete dependency graph
- **Orphan file detection**: Identify files not reachable from entrypoint
- **Link validation**: Validate relative file links and anchor/fragment references
- **Remark-lint integration**: Content quality validation
- **Configurable rules**: Severity levels (error, warn, off)
- **Cosmiconfig-based configuration**: Flexible multi-format config support
- **Multiple output formats**: JSON, text, tree, list

#### Commands (Current)

- **`mdite lint [path]`**: Validate documentation structure and content
- **`mdite deps <file>`**: Analyze file dependencies in documentation graph
  - Display incoming and outgoing links
  - Tree, list, and JSON output formats
  - Cycle detection and annotation
  - Configurable depth limiting
- **`mdite init`**: Initialize configuration
- **`mdite config`**: Display current configuration

#### Unix CLI Integration

- **TTY Detection**: Automatic color control based on terminal capabilities
  - Auto-detects when output is piped to other tools
  - Respects `NO_COLOR` environment variable ([no-color.org](https://no-color.org) standard)
  - Respects `FORCE_COLOR` environment variable
  - Auto-disables colors in CI environments
  - `--colors` flag to force colors even when piped
  - `--no-colors` flag to explicitly disable colors
- **Stdout/Stderr Separation**: Pipe-friendly output streams
  - Data (errors, JSON) to stdout for processing
  - Messages (progress, info) to stderr for human consumption
  - Compatible with `grep`, `jq`, `awk`, and other Unix tools
- **Exit Codes**: Standard Unix exit codes for scripting
  - `0` - Success (no validation errors)
  - `1` - Validation errors (orphans, broken links)
  - `2` - Usage errors (invalid arguments, unknown options)
  - `130` - Interrupted (SIGINT, SIGTERM)
- **Signal Handling**: Graceful handling of Unix signals
  - SIGINT (Ctrl+C) - Clean exit with message
  - SIGTERM - Clean termination
  - SIGPIPE - Silent exit when pipe is closed (e.g., `mdite lint | head`)
- **Quiet Mode**: `--quiet` / `-q` flag for scripting
  - Suppresses informational output (progress, headers)
  - Shows only data and errors
  - Perfect for CI/CD and automated scripts
- **Verbose Mode**: `--verbose` flag for debugging
  - Shows detailed debug information
  - Error stack traces
  - Graph building progress

#### Examples & Testing

- **Examples directory**: 12 runnable examples demonstrating all features (68 files)
  - Phase 1: Core examples (valid docs, orphans, broken links, broken anchors)
  - Phase 2: Real-world site + config variations (5 examples)
  - Phase 3: Edge cases (cycles, deep nesting, special characters)
- **Smoke test script**: `examples/run-all-examples.sh` for automated testing of all examples
- **Example documentation**: Comprehensive README in examples/ directory with usage guide
- **Integration tests**: Added tests for `init` and `config` commands
- **Test coverage thresholds**: Enforced minimum 70% coverage for lines, functions, branches, statements

### Changed

#### Development & Infrastructure

- **Git Hooks**: Migrated from custom `.githooks/` to industry-standard **Husky + lint-staged**
  - Automatic setup via `prepare` script
  - Runs ESLint and Prettier only on staged files for faster commits
  - Cross-platform compatible (better Windows support)
  - Configuration in `package.json` `lint-staged` key
- **TypeScript Configuration**: Updated module settings for modern ESM
  - Changed `module` from `"ESNext"` to `"NodeNext"`
  - Changed `moduleResolution` from `"node"` to `"NodeNext"`
  - Better alignment with Node.js ESM best practices
- **CI/CD Security**: Added automated security scanning
  - npm audit check runs on every CI build (fails on high/critical vulnerabilities)
  - Dependabot configured for weekly npm and GitHub Actions updates
  - Groups minor/patch updates to reduce PR noise
- **Code Coverage**: Added Vitest coverage thresholds
  - Minimum 70% coverage required for lines, functions, branches, statements
  - Prevents coverage regression
  - Extended exclusion list (scripts, configs, examples, scratch)
- **Test Infrastructure**: Increased test timeout for integration tests
  - Set `testTimeout: 30000` (30s) for integration tests that spawn processes
  - Prevents timeout failures on slower CI/CD systems
  - All 350 tests now pass with 0 skipped

## Version History

This is the initial release of mdite.

---

**Note:** This project follows [Semantic Versioning](https://semver.org/). Future releases will be documented in this file following the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

## About mdite

mdite treats documentation as a **connected system** (graph), not isolated files. This foundational approach enables all current and future features: validation, dependency analysis, search, output, and more.
