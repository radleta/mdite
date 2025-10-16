# doc-lint

A project-level linter for validating the structural integrity and consistency of Markdown documentation repositories.

## Features

- **🔍 Graph Traversal** - Builds a dependency graph from an entrypoint and validates all reachable files
- **🚨 Orphan Detection** - Identifies markdown files not reachable from the documentation root
- **🔗 Link Validation** - Validates relative file links and anchor/fragment links
- **📝 Content Linting** - Integrates remark-lint for style and formatting checks
- **⚙️ Configurable** - Uses cosmiconfig for flexible configuration management
- **📊 Multiple Output Formats** - Supports both human-readable text and machine-readable JSON output

## Installation

```bash
npm install -g doc-lint
```

## Quick Start

```bash
# Initialize configuration
doc-lint init

# Lint your documentation
doc-lint lint

# Lint specific directory
doc-lint lint ./docs

# Output as JSON
doc-lint lint --format json
```

## Examples

The `examples/` directory contains 12 runnable demonstrations of doc-lint features (68 files total).

### Try the Examples

```bash
# Explore a valid documentation structure
cd examples/01-valid-docs
doc-lint lint

# See orphan file detection in action
cd examples/02-orphan-files
doc-lint lint

# Experiment with different config formats
cd examples/06-config-variations/strict
doc-lint lint
```

### Run All Examples (Smoke Test)

```bash
cd examples
chmod +x run-all-examples.sh
./run-all-examples.sh
```

This runs doc-lint against all 12 example sets, verifying both passing and failing scenarios.

**Available examples:**
- **Phase 1:** Core features (valid docs, orphans, broken links, broken anchors)
- **Phase 2:** Real-world site + config variations (5 examples showing different config formats)
- **Phase 3:** Edge cases (cycles, deep nesting, special characters)

See [examples/README.md](./examples/README.md) for complete documentation.

## Configuration

Create a `doclint.config.js` file in your project root:

```javascript
module.exports = {
  entrypoint: 'README.md',
  rules: {
    'orphan-files': 'error',
    'dead-link': 'error',
    'dead-anchor': 'error',
  },
};
```

### Configuration Options

- **`entrypoint`** (string): The root file to start graph traversal from (default: `'README.md'`)
- **`rules`** (object): Rule configuration with severity levels (`'error'`, `'warn'`, `'off'`)
- **`frontmatterSchema`** (object, optional): JSON Schema for validating YAML frontmatter
- **`extends`** (array, optional): Inherit configuration from other packages

### Supported Configuration Formats

- `doclint.config.js` / `doclint.config.cjs`
- `.doclintrc`
- `.doclintrc.json`
- `.doclintrc.yaml`
- `.doclintrc.yml`
- `doclint` field in `package.json`

**See examples:** Check out [examples/06-config-variations](./examples/06-config-variations/) for working examples of all configuration formats.

## Rules

### Built-in Rules

| Rule | Description | Default |
|------|-------------|---------|
| `orphan-files` | Detects files not reachable from entrypoint | `error` |
| `dead-link` | Detects broken relative file links | `error` |
| `dead-anchor` | Detects broken anchor/fragment links | `error` |

### Remark Integration

doc-lint integrates with the remark-lint ecosystem, supporting:
- **remark-gfm** - GitHub Flavored Markdown support
- **remark-frontmatter** - YAML frontmatter parsing
- **remark-lint** - Comprehensive style and formatting rules

## CLI Commands

### `doc-lint lint [path]`

Lint documentation files.

**Options:**
- `--format <type>` - Output format (`text` or `json`, default: `text`)
- `--fix` - Auto-fix issues (not implemented in v1)
- `--config <path>` - Path to configuration file
- `--no-colors` - Disable colored output
- `--verbose` - Verbose output

**Examples:**
```bash
# Lint current directory
doc-lint lint

# Lint specific directory
doc-lint lint ./docs

# Output as JSON for CI/CD
doc-lint lint --format json

# Use custom config
doc-lint lint --config custom-config.js
```

### `doc-lint init`

Initialize a configuration file.

**Options:**
- `--config <path>` - Configuration file path (default: `doclint.config.js`)

### `doc-lint config`

Display current configuration (merged from all sources).

### `doc-lint deps <file>`

Show dependencies for a specific file in the documentation graph.

**Options:**
- `--incoming` - Show only incoming dependencies (what references this file)
- `--outgoing` - Show only outgoing dependencies (what this file references)
- `--depth <n>` - Maximum depth of traversal (default: unlimited)
- `--format <type>` - Output format: `tree`, `list`, or `json` (default: `tree`)

**Examples:**
```bash
# Show all dependencies (both incoming and outgoing)
doc-lint deps README.md

# Show only what references this file
doc-lint deps docs/api.md --incoming

# Show only what this file references
doc-lint deps docs/guide.md --outgoing

# Limit to direct dependencies only
doc-lint deps README.md --depth 1

# Get JSON output for scripting
doc-lint deps docs/guide.md --format json

# Show as flat list instead of tree
doc-lint deps README.md --format list
```

## How It Works

### 1. Graph Building

doc-lint starts from the configured `entrypoint` (default: `README.md`) and recursively follows all relative markdown links to build a complete dependency graph of your documentation.

**See it in action:** Check [examples/01-valid-docs](./examples/01-valid-docs) for a working example, or [examples/02-orphan-files](./examples/02-orphan-files) to see orphan detection.

### 2. Orphan Detection

After building the graph, doc-lint scans the filesystem for all `.md` files and compares them against the graph. Any files not reachable from the entrypoint are reported as orphans.

### 3. Link Validation

For each file in the graph, doc-lint:
- Validates that relative file links point to existing files
- Validates that anchor links (`#heading`) resolve to actual headings
- Validates cross-file anchor links (`file.md#heading`)

### 4. Content Linting

Each file is processed through the remark engine with configured lint rules to check for:
- Heading structure and formatting
- List formatting
- Code block syntax
- Frontmatter validation
- And many more via remark-lint plugins

## Exit Codes

- `0` - No errors found
- `1` - Errors found or execution failed

## Example Output

### Text Format (Default)

```
doc-lint
──────────────────────────────────────────────────
ℹ Linting: ./docs
ℹ Entrypoint: README.md

ℹ Building dependency graph...
✓ Found 15 reachable files
ℹ Checking for orphaned files...
✗ Found 2 orphaned file(s)
ℹ Validating links...
✗ Found 3 link error(s)
ℹ Running remark linter...
✓ No style errors


Found 5 issue(s)
──────────────────────────────────────────────────

docs/old-guide.md
  - error Orphaned file: not reachable from entrypoint [orphan-files]

docs/setup.md
  7:3 error Dead link: installation.md [dead-link]
  12:5 error Dead anchor: #prerequisites in setup.md [dead-anchor]

✗ 5 error(s), 0 warning(s)
```

### JSON Format

```json
[
  {
    "rule": "orphan-files",
    "severity": "error",
    "file": "docs/old-guide.md",
    "line": 0,
    "column": 0,
    "message": "Orphaned file: not reachable from entrypoint"
  },
  {
    "rule": "dead-link",
    "severity": "error",
    "file": "docs/setup.md",
    "line": 7,
    "column": 3,
    "message": "Dead link: installation.md"
  }
]
```

## Use Cases

### Pre-commit Hook

```bash
#!/bin/sh
npm run build && doc-lint lint || exit 1
```

### CI/CD Integration

```yaml
# GitHub Actions
- name: Lint Documentation
  run: |
    npm install -g doc-lint
    doc-lint lint --format json > lint-results.json
```

### Documentation Site Build

```bash
# Ensure documentation is valid before building
doc-lint lint && npm run build-docs
```

### Smoke Testing

Quick verification of doc-lint functionality:

```bash
# Run all 12 example tests
cd examples && ./run-all-examples.sh
```

See [examples/](./examples/) for 12 ready-to-use test cases covering all features.

## Development

```bash
# Clone repository
git clone https://github.com/yourusername/doc-lint.git
cd doc-lint

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck

# Run all quality checks
npm run validate

# Test against examples
cd examples
./run-all-examples.sh

# Or test individual examples
cd examples/01-valid-docs
doc-lint lint
```

## Architecture

doc-lint is built as an orchestrator that coordinates multiple subsystems:

- **CLI Layer** - Commander.js-based interface
- **Configuration Manager** - Cosmiconfig-based config loading
- **Graph Analyzer** - Builds and analyzes document dependency graph
- **Link Validator** - Validates file and anchor links
- **Remark Engine** - Integrates remark-lint for content validation
- **Reporter** - Formats and outputs results

See [implementation plan](./scratch/first-version/plan/) for detailed architecture documentation.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © 2025 Richard Adleta

## Disclaimer

**This is a developer tool - use at your own risk.**

This software is provided "as is", without warranty of any kind. The tool performs static analysis of local markdown files and does not execute code or transmit data externally.

**Issues and bugs:** Please report all issues (including security-related ones) via [GitHub Issues](https://github.com/radleta/doc-lint/issues). We make no guarantees about response times or fixes.

## Acknowledgments

Built with:
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [unified/remark](https://unifiedjs.com/) - Markdown processing
- [Zod](https://github.com/colinhacks/zod) - Schema validation
- [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) - Configuration management
- [Vitest](https://vitest.dev/) - Testing framework

## Roadmap

See [implementation-phases.md](./scratch/first-version/plan/implementation-phases.md) for the complete development roadmap.

### Future Enhancements

- Auto-fix support (`--fix` flag)
- External link validation (HTTP/HTTPS)
- Caching for improved performance
- Custom rule authoring API
- Watch mode
- LSP server for editor integration
