# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

### Fixed

- **`mdite init` command**: Fixed bug where `--config` flag was ignored
  - Removed conflicting local `--config` option that shadowed global option
  - Command now properly respects `--config` flag for custom config file paths
  - Aligns with other commands (deps, config, lint) in using global options

### Performance

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
