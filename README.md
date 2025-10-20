# mdite

[![npm version](https://img.shields.io/npm/v/mdite.svg)](https://www.npmjs.com/package/mdite)
[![CI](https://github.com/radleta/mdite/actions/workflows/ci.yml/badge.svg)](https://github.com/radleta/mdite/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Markdown documentation toolkit** - Work with your documentation as a connected system, not scattered files.

mdite treats your markdown documentation as a cohesive whole. Map dependencies, validate structure, search across files, and pipe content—all while understanding how your docs connect together.

---

## The Vision

Most tools treat markdown files as isolated documents. mdite treats them as a **connected system**.

### Current Reality

- 📄 Edit files one at a time
- 🔍 grep individual files, hope you find everything
- 🤷 No idea what's connected to what
- 💥 Break things when refactoring
- 🗑️ Afraid to delete anything

### With mdite

- 🕸️ **See the whole system** - Your docs are a graph, visualize it
- 🔍 **Search the system** - Query across all connected docs
- 📊 **Understand dependencies** - Know what links to what
- ✅ **Validate structure** - Catch broken links and orphans
- 🎯 **Work confidently** - Refactor and clean up without fear

---

## What mdite Does

mdite is a toolkit for working with markdown documentation as a unified system:

### 📊 Map & Analyze (`deps`)

```bash
# See what connects to what
mdite deps docs/api.md --incoming

# Understand your doc structure
mdite deps README.md --format tree
```

### ✅ Validate & Lint (`lint`)

```bash
# Catch broken links and orphans
mdite lint

# CI/CD integration
mdite lint --format json
```

### 🔍 Query & Search (coming soon)

```bash
# Search across your doc system
mdite query "authentication" --files

# Find docs by name pattern
mdite query "api-*" --names
```

### 📤 Export & Pipe (`cat`)

```bash
# Output entire doc system
mdite cat | less

# Pipe to shell tools
mdite cat docs/api/*.md | grep "function"

# Combine with other tools
mdite cat --order deps | pandoc -o book.pdf
```

**The key:** mdite understands how your docs connect, so it can treat them as a unified system.

---

## Quick Start

### Installation

```bash
npm install -g mdite
```

### Three Core Workflows

#### 1. Understand Your Docs (Graph Analysis)

```bash
# Map the structure
mdite deps README.md

# What references this file?
mdite deps docs/api.md --incoming

# What does this file reference?
mdite deps docs/guide.md --outgoing
```

**Use case:** Before changing anything, understand the impact.

#### 2. Validate Your Docs (Linting)

```bash
# Check for issues
mdite lint

# Find orphaned files
mdite lint --verbose

# CI/CD integration
mdite lint --format json
```

**Use case:** Catch broken links and structural issues.

#### 3. Configure (Optional)

```bash
# Create custom config
mdite init

# See merged config
mdite config
```

**Use case:** Customize for your project's needs.

---

## Core Features

### 🕸️ Documentation as a Graph

mdite builds a complete dependency graph of your documentation starting from an entrypoint (usually `README.md`), following all internal links.

**Why this matters:** You can see exactly how your docs connect. No more guessing about structure or dependencies.

```bash
mdite deps README.md
# Output:
# README.md
# ├── docs/getting-started.md
# │   ├── docs/installation.md
# │   └── docs/configuration.md
# ├── docs/api-reference.md
# └── docs/guides/
```

**This graph is the foundation** for everything mdite does - validation, analysis, search, export.

### 📊 Dependency Analysis

Understand what connects to what before making changes:

```bash
# Impact analysis: What will break if I change this?
mdite deps docs/api.md --incoming
# Shows: README.md, guide.md, tutorial.md all reference it

# Scope analysis: What does this file depend on?
mdite deps docs/guide.md --outgoing
# Shows: Links to setup.md, api.md, troubleshooting.md
```

**Real-world use cases:**

- 🔧 **Refactoring:** Know the impact before renaming/moving files
- 🧹 **Cleanup:** Find files that nothing depends on (safe to delete)
- 📖 **Documentation:** Understand your doc structure
- 🎯 **Navigation:** Find central hub documents

### ✅ Structure Validation

Catch issues before they reach users:

**Orphan Detection:**
Find markdown files that aren't linked from anywhere—dead weight in your repo.

```bash
mdite lint
# ✗ Found 3 orphaned files:
#   - old-guide.md
#   - deprecated-api.md
#   - scratch-notes.md
```

**Link Validation:**
Validates three types of links:

- **File links:** `[guide](./setup.md)` → validates file exists
- **Anchor links:** `[intro](#getting-started)` → validates heading exists
- **Cross-file anchors:** `[api](./api.md#methods)` → validates both

**Benefit:** Zero 404s in your documentation.

### 🔍 System-Wide Operations

Because mdite understands your docs as a system, it can do things other tools can't:

**Export the system:**

```bash
# Output entire doc system in dependency order
mdite cat --order deps

# Output in alphabetical order
mdite cat --order alpha

# Pipe to shell tools
mdite cat | grep -n "TODO"
mdite cat | wc -l  # Total lines in doc system

# Export as single file
mdite cat --order deps | pandoc -o documentation.pdf

# JSON format with metadata
mdite cat --format json | jq '.[] | {file, wordCount}'
```

**Coming Soon:**

**Search across the system:**

```bash
# Find all docs mentioning "authentication"
mdite query "authentication" --content

# Find docs matching name pattern
mdite query "api-*" --names

# Search in a specific section of the graph
mdite query "config" --from docs/reference/
```

**Transform the system:**

```bash
# Generate table of contents from graph
mdite toc --depth 2

# Validate external links (HTTP/HTTPS)
mdite lint --external
```

---

## Why mdite?

### The Problem: Documentation is a System, But Tools Treat It Like Files

You have 50 markdown files that form a cohesive documentation site, but:

- ❌ You edit them one at a time (disconnected)
- ❌ You search them one at a time (`grep file1.md`, `grep file2.md`...)
- ❌ You have no idea how they connect
- ❌ Refactoring is terrifying (what will break?)
- ❌ You don't know what's safe to delete

**mdite solves this by treating your docs as a connected graph.**

### What Makes mdite Different?

| Capability                | Traditional Tools                | mdite                           |
| ------------------------- | -------------------------------- | ------------------------------- |
| **Link validation**       | ❌ Can't detect broken links     | ✅ Validates all internal links |
| **Orphan detection**      | ❌ No concept of reachability    | ✅ Finds unreachable files      |
| **Dependency analysis**   | ❌ No understanding of structure | ✅ Maps entire graph            |
| **System-wide search**    | ❌ Search files individually     | ✅ Query the whole system       |
| **Structural operations** | ❌ File-by-file only             | ✅ Operates on connected docs   |

### vs. Traditional Markdown Linters

**markdownlint / remark-lint:**

- ✅ Check style (formatting, syntax)
- ❌ Don't understand document relationships
- ❌ Can't detect orphaned files
- ❌ Miss structural issues
- ❌ File-centric, not system-centric

**mdite:**

- ✅ Validates structure and relationships
- ✅ Detects orphaned files
- ✅ Maps dependencies
- ✅ System-centric operations
- ✅ Understands your docs as a connected whole

**Use both:** Traditional linters for style, mdite for structure and system operations.

---

## Real-World Workflows

### 1. Safe Refactoring

```bash
# Step 1: Understand the impact
mdite deps docs/old-api.md --incoming
# Shows: README.md, tutorial.md, guide.md reference it

# Step 2: Rename the file
mv docs/old-api.md docs/api-reference.md

# Step 3: Update the 3 files that link to it

# Step 4: Validate
mdite lint
# ✅ All links valid
```

**Benefit:** Refactor with confidence, not fear.

### 2. Documentation Spring Cleaning

```bash
# Find orphaned files
mdite lint
# ✗ Found 5 orphaned files

# Review each one
mdite deps old-guide.md --incoming
# Shows: nothing links to it

# Safe to delete!
rm old-guide.md deprecated-api.md scratch-notes.md

# Verify
mdite lint
# ✅ All clean, only connected docs remain
```

**Benefit:** Clean repos, confident deletions.

### 3. Pre-Release Documentation Check

```bash
# Validate structure
mdite lint

# Check for orphans (incomplete docs)
mdite lint --verbose | grep "orphan"

# Verify all API docs are reachable
mdite deps README.md --format list | grep "api"

# Green light to release
mdite lint --format json
# Exit code 0 = ship it
```

**Benefit:** Never ship broken documentation.

### 4. Understanding a New Codebase

```bash
# Start at the entry point
mdite deps README.md --depth 1
# Shows: Top-level structure

# Explore a section
mdite deps docs/architecture.md
# Shows: What it connects to

# Find all API docs
mdite deps README.md --format list | grep api
# Lists all API documentation files
```

**Benefit:** Quickly understand documentation structure.

### 5. CI/CD Quality Gate

```yaml
# .github/workflows/docs.yml
name: Documentation Quality

on: [pull_request]

jobs:
  validate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install -g mdite
      - run: mdite lint --format json
      # Fails if broken links or orphans detected
```

**Benefit:** Documentation quality is enforced, not hoped for.

### 6. Unix Tool Integration (Piping & Scripting)

```bash
# Find all files with broken links
mdite lint | grep "Dead link" | cut -d: -f1 | sort | uniq

# Count errors by type
mdite lint | grep -o "\\[.*\\]" | sort | uniq -c

# Get JSON summary with jq
mdite lint --format json | jq '[.[] | .severity] | group_by(.) | map({severity: .[0], count: length})'

# List all orphaned files
mdite lint --format json | jq -r '.[] | select(.rule=="orphan-files") | .file'

# Check if specific file has errors
mdite lint | grep "docs/api.md" && echo "API docs need fixing"

# Quiet mode for scripting (no progress messages)
ERRORS=$(mdite lint --quiet 2>/dev/null)
if [ -n "$ERRORS" ]; then
  echo "$ERRORS" | mail -s "Doc errors" team@example.com
fi

# Analyze dependencies
mdite deps README.md --format json | jq '.stats.totalFiles'

# Find deeply nested docs
mdite deps README.md --format json | jq '.outgoing[] | select(.depth > 3) | .file'

# Export dependency graph as CSV
mdite deps README.md --format json | jq -r '.outgoing[] | [.file, .depth] | @csv'
```

**Benefit:** Full integration with Unix ecosystem (grep, jq, awk, sed, mail, etc.)

### 7. Progressive Validation

```bash
# Start with core docs only
mdite lint --depth 1

# Gradually expand validation
mdite lint --depth 2
mdite lint --depth 3

# Finally, full validation
mdite lint
```

**Benefit:** Incremental adoption of mdite in large doc repos, validate core docs first.

---

## Commands

### Global Options

These options work with all commands:

- `--config <path>` - Path to custom config file
- `--colors` - Force colored output (even when piped)
- `--no-colors` - Disable colored output
- `-q, --quiet` - Quiet mode (suppress informational output, show only data/errors)
- `--verbose` - Enable verbose/debug output
- `-V, --version` - Output the version number
- `-h, --help` - Display help for command

**Usage:**

```bash
# Use verbose mode with any command
mdite lint --verbose
mdite deps README.md --verbose

# Quiet mode for scripting (only data/errors, no info messages)
mdite lint --quiet
mdite deps README.md --quiet --format json | jq '.stats'

# Use custom config with any command
mdite lint --config custom-config.js
mdite init --config .mditerc.json

# Control colors
mdite lint --no-colors              # Disable colors
mdite lint --colors | less -R       # Force colors even when piped
```

**Color Detection:**

mdite automatically detects whether colors should be used:

- **Auto-enabled** when output is a terminal (TTY)
- **Auto-disabled** when piped to other tools
- **Force with `--colors`** to override detection
- **Disable with `--no-colors`** or `NO_COLOR=1` env var

**Environment Variables:**

- `NO_COLOR` - Disable colors (respects [no-color.org](https://no-color.org) standard)
- `FORCE_COLOR` - Force colors even when not a TTY
- `CI=true` - Disables colors in CI environments (unless `FORCE_COLOR` is set)

### `mdite deps <file>` - Analyze Dependencies

Visualize and analyze documentation structure.

```bash
# Tree view of dependencies
mdite deps README.md

# What references this file? (incoming)
mdite deps docs/api.md --incoming

# What does this file reference? (outgoing)
mdite deps docs/guide.md --outgoing

# Limit depth
mdite deps README.md --depth 2

# JSON output for tooling
mdite deps docs/api.md --format json

# List format
mdite deps README.md --format list
```

**Options:**

- `--incoming` - Show what references this file
- `--outgoing` - Show what this file references
- `--depth <n>` - Limit traversal depth
- `--format <type>` - Output: `tree` (default), `list`, or `json`

**Use cases:**

- 🔍 Impact analysis before refactoring
- 🧹 Finding safe-to-delete files
- 📊 Understanding documentation structure
- 🎯 Identifying central hub documents

### `mdite lint [path]` - Validate Structure

Check documentation for structural issues.

```bash
# Lint from current directory
mdite lint

# Lint specific directory
mdite lint ./docs

# JSON output for CI/CD (auto-disables colors)
mdite lint --format json

# Pipe JSON to jq for analysis
mdite lint --format json | jq '.[] | select(.severity=="error")'

# Quiet mode for scripting (only errors shown)
mdite lint --quiet

# Verbose output (shows debug info to stderr)
mdite lint --verbose

# NEW: Lint multiple files as entry points
mdite lint README.md docs/api.md docs/guide.md --depth 1

# Perfect for pre-commit hooks (lint only changed files)
CHANGED=$(git diff --cached --name-only --diff-filter=ACM | grep '\.md$')
mdite lint $CHANGED --depth 1
```

#### Multi-File Validation (NEW)

Lint multiple specific files as independent entry points:

```bash
# Lint multiple entry points
mdite lint core/api.md core/cli.md core/config.md

# Each file starts at depth 0
# Results are merged and deduplicated
# Orphans = files not reachable from ANY entry point
```

**Use Cases:**

- **Pre-commit hooks:** Lint only changed markdown files
- **Selective validation:** Check specific docs without full traversal
- **CI/CD:** Parallel validation of independent sections
- **Author workflow:** Work on multiple related docs

**Example:**

```bash
# Pre-commit: validate changed files and their immediate links
mdite lint $(git diff --cached --name-only | grep '\.md$') --depth 1
```

**Options:**

- `--format <type>` - Output: `text` (default) or `json`
- `--entrypoint <file>` - Entrypoint file (overrides config, cannot be used with multiple files)
- `--depth <n>` - Maximum depth of traversal (default: unlimited, applies to all files)
- `-q, --quiet` - Suppress informational output (only show errors)

**Global options** (apply to all commands):

- `--config <path>` - Custom config file
- `--no-colors` - Disable colored output
- `--verbose` - Detailed output

**Output Streams:**

- **stdout** - Validation results (errors, warnings)
- **stderr** - Informational messages (progress, summaries)

This separation makes mdite pipe-friendly:

```bash
# Grep for specific errors
mdite lint | grep "Dead link"

# Count errors
mdite lint | wc -l

# Process JSON with jq
mdite lint --format json | jq '.[] | .file' | sort | uniq

# Suppress progress messages, keep only errors
mdite lint 2>/dev/null
```

**What it validates:**

- ✅ All files reachable from entrypoint
- ✅ No orphaned files
- ✅ All file links are valid
- ✅ All anchor references exist
- ✅ No broken cross-file anchor links

### `mdite cat [files...]` - Output Documentation Content

Output documentation content in various formats and orderings.

```bash
# Output all files in dependency order (default)
mdite cat

# Output in alphabetical order
mdite cat --order alpha

# Use custom separator between files
mdite cat --separator "\\n---\\n"

# Output as JSON with metadata
mdite cat --format json

# Pipe to other tools
mdite cat | grep "TODO"
mdite cat | wc -l

# Export as single file
mdite cat --order deps | pandoc -o docs.pdf

# Combine with jq for analysis
mdite cat --format json | jq '.[] | {file, wordCount}'
```

**Options:**

- `[files...]` - Specific files to output (optional, defaults to all files in graph)
- `--order <type>` - Output order: `deps` (dependency order, default) or `alpha` (alphabetical)
- `--separator <text>` - Text between files (default: `\n\n`). Supports escape sequences like `\n`, `\t`
- `--format <type>` - Output format: `markdown` (default) or `json`
- `--exclude <pattern...>` - Exclude file patterns (gitignore-style)
- `--respect-gitignore` - Respect .gitignore patterns
- `--no-exclude-hidden` - Don't exclude hidden directories

**Output Formats:**

**Markdown (default):**

- Outputs raw file content concatenated with separators
- Perfect for piping to other tools
- Streams to stdout for efficiency

**JSON:**

- Structured output with metadata for each file
- Includes: file path, depth, content, word count, line count
- Ideal for programmatic processing

**Use cases:**

- 📤 **Export:** Create single-file documentation artifacts
- 🔄 **Transform:** Pipe to pandoc, markdown processors, or custom tools
- 📊 **Analyze:** Extract statistics, search patterns, or validate content
- 🎯 **Integration:** Build documentation pipelines and workflows

**Examples:**

````bash
# Generate PDF documentation
mdite cat --order deps | pandoc --toc -o documentation.pdf

# Count total words in documentation
mdite cat | wc -w

# Find all TODOs across documentation
mdite cat | grep -n "TODO"

# Get statistics from JSON
mdite cat --format json | jq '[.[] | .wordCount] | add'

# Extract code blocks
mdite cat | awk '/```/,/```/'
````

### `mdite init` - Initialize Configuration

Create a configuration file.

```bash
# Create default config file (mdite.config.js)
mdite init

# Create config file with custom path
mdite init --config .mditerc.json
```

**Options:**

- `--config <path>` - Config file path (default: `mdite.config.js`)

### `mdite config` - Show Configuration

Display merged configuration from all sources.

```bash
mdite config
```

### Future Commands

Coming soon as mdite expands:

#### `mdite query <pattern>` - Search Documentation System

```bash
# Search content across all docs
mdite query "authentication"

# Search filenames
mdite query "api-*" --names

# Search in specific subsection
mdite query "config" --from docs/reference/
```

#### `mdite toc` - Generate Table of Contents

```bash
# Generate TOC from graph
mdite toc --depth 2
```

---

## Configuration

### Zero Config

mdite works out of the box:

```bash
mdite lint  # Just works
mdite deps README.md  # Just works
```

**Defaults:**

- Entrypoint: `README.md`
- All rules: `error`
- Output: colored text

### Custom Configuration

Create `mdite.config.js` for project-specific settings:

```javascript
module.exports = {
  // Start traversal from a different file
  entrypoint: 'docs/index.md',

  // Customize rule severity
  rules: {
    'orphan-files': 'error', // Block build on orphans
    'dead-link': 'error', // Block build on broken links
    'dead-anchor': 'warn', // Warn but don't block
  },
};
```

### Configuration Formats

| Format       | File              | Use Case                  |
| ------------ | ----------------- | ------------------------- |
| JavaScript   | `mdite.config.js` | Comments, computed values |
| JSON         | `.mditerc`        | Simple, no comments       |
| YAML         | `.mditerc.yaml`   | Human-readable, comments  |
| package.json | `"mdite": {}`     | Keep config in one place  |

**Priority:** CLI flags > Project config > Defaults

See [examples/06-config-variations](./examples/06-config-variations/) for working examples.

### Rules

| Rule           | What It Detects                   | Default |
| -------------- | --------------------------------- | ------- |
| `orphan-files` | Files unreachable from entrypoint | `error` |
| `dead-link`    | Broken relative file links        | `error` |
| `dead-anchor`  | Broken `#heading` references      | `error` |

**Severity levels:**

- `error` - Fail (exit code 1)
- `warn` - Show warning, don't fail
- `off` - Disable rule

### Exit Codes

mdite follows Unix conventions for exit codes:

| Code  | Meaning          | When                                                        |
| ----- | ---------------- | ----------------------------------------------------------- |
| `0`   | Success          | No validation errors found                                  |
| `1`   | Validation Error | Orphaned files, broken links, or validation failures        |
| `2`   | Usage Error      | Invalid arguments, unknown options, or configuration errors |
| `130` | Interrupted      | Process interrupted (Ctrl+C, SIGINT, SIGTERM)               |

**Usage in scripts:**

```bash
# Check exit code
if mdite lint; then
  echo "Documentation is valid"
else
  echo "Documentation has errors"
  exit 1
fi

# CI/CD pipeline
mdite lint --format json || exit 1

# Conditional logic
mdite lint && npm run deploy

# Capture exit code
mdite lint
EXIT_CODE=$?
if [ $EXIT_CODE -eq 1 ]; then
  echo "Validation errors found"
elif [ $EXIT_CODE -eq 2 ]; then
  echo "Usage error - check your command"
fi
```

**Signal Handling:**

mdite gracefully handles Unix signals:

- **SIGINT** (Ctrl+C) - Clean exit with code 130
- **SIGTERM** - Clean exit with code 130
- **SIGPIPE** - Gracefully exits when pipe is closed (e.g., `mdite lint | head`)

---

## Example Output

### `mdite lint` - Validation

```
mdite
──────────────────────────────────────────────────
ℹ Linting: ./docs
ℹ Entrypoint: README.md

ℹ Building dependency graph...
✓ Found 24 reachable files

ℹ Checking for orphaned files...
✗ Found 3 orphaned files

ℹ Validating links...
✗ Found 2 link errors


Found 5 issue(s)
──────────────────────────────────────────────────

docs/old-guide.md
  - error Orphaned file: not reachable from entrypoint [orphan-files]

docs/setup.md
  7:3 error Dead link: installation.md [dead-link]

✗ 5 error(s), 0 warning(s)
```

### `mdite deps` - Dependency Analysis

```bash
$ mdite deps README.md --depth 2

Dependencies for README.md
──────────────────────────────────────────────────

Outgoing (what this file references):
├── docs/getting-started.md
│   ├── docs/installation.md
│   └── docs/configuration.md
├── docs/api-reference.md
│   ├── docs/api/methods.md
│   └── docs/api/types.md
└── CONTRIBUTING.md

Incoming (what references this file):
(none - this is the entrypoint)

Cycles detected: 0
```

---

## Examples

The `examples/` directory contains 12 runnable demonstrations (68 files) showing mdite in action:

```bash
# Valid documentation
cd examples/01-valid-docs && mdite lint

# Orphan detection
cd examples/02-orphan-files && mdite lint

# Broken links
cd examples/03-broken-links && mdite lint

# Dependency analysis
cd examples/01-valid-docs && mdite deps README.md
```

**Run all examples:**

```bash
cd examples && ./run-all-examples.sh
```

See [examples/README.md](./examples/README.md) for complete documentation.

---

## How It Works

### The Graph Model

mdite treats your documentation as a directed graph:

- **Nodes:** Markdown files
- **Edges:** Links between files
- **Root:** Entrypoint file (default: `README.md`)

```
README.md (root)
├─→ docs/guide.md
│   ├─→ docs/setup.md
│   └─→ docs/api.md
└─→ CONTRIBUTING.md
    └─→ docs/development.md
```

### Graph Building Algorithm

1. **Start** at entrypoint (`README.md`)
2. **Parse** markdown to extract links
3. **Follow** each relative `.md` link
4. **Recursively** build graph (with cycle detection)
5. **Result:** Complete map of connected documentation

**What gets included:**

- ✅ Relative links: `[guide](./setup.md)`
- ✅ Links with anchors: `[api](./api.md#methods)`
- ✅ Anchor-only: `[intro](#getting-started)`

**What gets skipped:**

- ❌ External URLs: `https://example.com`
- ❌ Absolute paths outside project
- ❌ Non-markdown files

### Validation Using the Graph

Once the graph is built, mdite can:

- **Detect orphans:** Files NOT in the graph
- **Validate links:** Check edges point to existing nodes
- **Analyze dependencies:** Traverse graph in any direction
- **Future:** Query, search, export the graph

**This graph foundation** enables all current and future mdite features.

---

## Roadmap

mdite is evolving from a linter into a complete **documentation toolkit**.

### ✅ Current

- Graph-based dependency analysis (`deps`)
- Structural validation (`lint`)
- Orphan detection
- Link validation (file + anchor)
- Configuration system
- **Content output (`cat`)** - Export documentation content
  - Dependency-order and alphabetical output
  - JSON format with metadata
  - Pipe-friendly for Unix workflows

### 🚧 Future Features

- **`mdite query`** - Search across documentation system
  - Content search
  - Filename pattern matching
  - Scope to graph sections
- **`mdite toc`** - Generate table of contents from graph
- **`mdite stats`** - Documentation metrics and analysis
- **External link validation** - Check HTTP/HTTPS URLs
- **Watch mode** - Auto-validate on file changes
- **LSP server** - Editor integration
- **Custom rule API** - Write your own validation rules
- **Export formats** - PDF, HTML, etc. with graph awareness

**The vision:** A complete toolkit for working with markdown documentation as a unified, connected system.

---

## Integration

### Pre-Commit Hook (Husky)

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "mdite lint"
    }
  }
}
```

### GitHub Actions

```yaml
name: Documentation

on:
  pull_request:
    paths:
      - 'docs/**'
      - '*.md'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install -g mdite
      - run: mdite lint --format json
```

### Package.json Scripts

```json
{
  "scripts": {
    "docs:lint": "mdite lint",
    "docs:deps": "mdite deps README.md",
    "docs:check": "mdite lint && echo '✓ Documentation valid'",
    "predeploy": "mdite lint"
  }
}
```

---

## Contributing

mdite is evolving rapidly. Contributions welcome!

See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup
- Testing guidelines
- Pull request process
- Roadmap and feature ideas

---

## License

MIT © 2025 Richard Adleta

---

## About

**mdite** (markdown documentation toolkit) is built for developers and teams who work with interconnected markdown documentation.

Born from the frustration of broken docs and the realization that documentation is a **system**, not a collection of files, mdite provides the tools to work with that system effectively.

**Built with:**

- [TypeScript](https://www.typescriptlang.org/)
- [Commander.js](https://github.com/tj/commander.js)
- [unified/remark](https://unifiedjs.com/)
- [Zod](https://github.com/colinhacks/zod)

**Issues & Ideas:** [GitHub Issues](https://github.com/radleta/mdite/issues)

---

**Work with your documentation as a system, not scattered files.**

```bash
npm install -g mdite
mdite deps README.md    # Understand structure
mdite lint              # Validate integrity
```
