# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

## Version History

This is the initial release of mdite.

---

**Note:** This project follows [Semantic Versioning](https://semver.org/). Future releases will be documented in this file following the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

## About mdite

mdite treats documentation as a **connected system** (graph), not isolated files. This foundational approach enables all current and future features: validation, dependency analysis, search, output, and more.
