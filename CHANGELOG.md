# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Graph-based documentation traversal
- Orphan file detection
- Link validation (relative files and anchors)
- Remark-lint integration for content validation
- JSON and text output formats
- Configurable rules with severity levels
- Cosmiconfig-based configuration management
- **deps command**: Show file dependencies in documentation graph
  - Display incoming and outgoing links
  - Tree, list, and JSON output formats
  - Cycle detection and annotation
  - Configurable depth limiting

### Features

#### Core Linting
- **Graph Analyzer**: Builds dependency graph from entrypoint
- **Link Validator**: Validates relative file links and anchor references
- **Orphan Detection**: Identifies unreachable documentation files
- **Content Linting**: Remark-lint integration for markdown quality

#### Configuration
- **Flexible Config**: Supports multiple config formats (.js, .json, .yaml, package.json)
- **Layered Config**: CLI flags > File config > Defaults
- **Rule Configuration**: Customizable severity (error, warn, off)
- **Frontmatter Schema**: Optional YAML frontmatter validation

#### CLI
- `doc-lint lint [path]` - Lint documentation
- `doc-lint init` - Initialize configuration
- `doc-lint config` - Display current configuration
- `doc-lint deps <file>` - Show file dependencies in the documentation graph
- Multiple output formats (text, JSON, tree, list)
- Colored output (optional)
- Verbose mode

### Technical
- TypeScript with strict mode
- Commander.js CLI framework
- Unified/Remark ecosystem integration
- Zod schema validation
- Comprehensive error handling

## Version History

This is the initial release of doc-lint.

---

**Note:** This project follows [Semantic Versioning](https://semver.org/). Future releases will be documented in this file following the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.
