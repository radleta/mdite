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
