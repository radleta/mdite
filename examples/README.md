# mdite Examples

This directory contains runnable examples demonstrating mdite features and usage.

## Purpose

- 🧪 **Manual Testing** - Quick smoke tests to verify mdite works
- 📚 **Documentation** - Examples showing how to use the tool
- 🎓 **Learning** - See mdite in action with different scenarios

## Quick Start

```bash
# Install mdite globally (or use npm link for local development)
npm install -g mdite

# Run a valid example (no errors expected)
cd examples/01-valid-docs
mdite lint

# Run an example with errors (errors expected)
cd ../02-orphan-files
mdite lint
```

## Examples

### 01-valid-docs/ ✅

Perfect documentation structure with no errors. Use this to see what "passing" looks like.

**Try it:**

```bash
cd 01-valid-docs
mdite lint
```

**Expected:** ✅ 0 errors, 0 warnings

**Features demonstrated:**

- Proper documentation structure
- Valid internal links
- Connected dependency graph
- No orphaned files

---

### 02-orphan-files/ 🔍

Demonstrates orphan file detection - finding files not reachable from the entrypoint.

**Try it:**

```bash
cd 02-orphan-files
mdite lint
```

**Expected:** ❌ 1 error (orphaned file detected)

**Features demonstrated:**

- Orphan file detection
- Graph traversal from entrypoint
- Reporting unreachable files

---

### 03-broken-links/ 🔗

Shows broken link detection for non-existent files.

**Try it:**

```bash
cd 03-broken-links
mdite lint
```

**Expected:** ❌ 2 errors (dead links detected)

**Features demonstrated:**

- Dead link detection
- File path validation
- Relative link resolution

---

### 04-broken-anchors/ ⚓

Demonstrates anchor validation for heading links.

**Try it:**

```bash
cd 04-broken-anchors
mdite lint
```

**Expected:** ❌ 2 errors (broken anchors detected)

**Features demonstrated:**

- Anchor/fragment validation
- Heading slug generation
- Cross-file anchor checking

---

### 05-real-world/ 🌍

Realistic multi-page documentation site with comprehensive structure.

**Try it:**

```bash
cd 05-real-world
mdite lint
```

**Expected:** ✅ 0 errors (complete valid site)

**Features demonstrated:**

- Real-world documentation structure
- Multiple directories and levels
- Cross-references between sections
- JavaScript config with comments
- Comprehensive interconnected docs (13 files)

---

### 06-config-variations/ ⚙️

Different configuration formats and styles.

Demonstrates:

- **minimal/** - Minimal config (defaults)
- **strict/** - JavaScript config with comments
- **warnings/** - YAML config with warnings
- **package-json/** - Config embedded in package.json

**Try it:**

```bash
cd 06-config-variations/strict
mdite lint
```

**Expected:** ✅ 0 errors for all variations

**Features demonstrated:**

- Multiple config formats (.js, .json, .yaml, package.json)
- Different severity levels (error, warn, off)
- Config file comparisons
- Comments in config files

---

### 07-edge-cases/ 🔄

Complex scenarios testing robustness.

Demonstrates:

- **cycles/** - Circular references (A→B→C→A)
- **deep-nesting/** - 6-level deep directory structure
- **special-chars/** - Files with hyphens, underscores, numbers

**Try it:**

```bash
cd 07-edge-cases/cycles
mdite lint
```

**Expected:** ✅ 0 errors (handled gracefully)

**Features demonstrated:**

- Cycle detection (no infinite loops)
- Deep path resolution
- Special character handling
- Robustness testing

---

### 08-depth-limiting/ 📏

Demonstrates depth limiting feature for progressive validation.

**Try it:**

```bash
cd 08-depth-limiting
mdite lint --depth 1
mdite lint --depth 2
mdite lint  # unlimited
```

**Expected:**

- Depth 1: 2 reachable files, 2 orphans
- Depth 2: 3 reachable files, 1 orphan
- Unlimited: 4 reachable files, 0 orphans

**Features demonstrated:**

- Depth-limited graph traversal
- Progressive validation workflow
- Orphan detection with depth constraints
- Performance optimization for large doc sets

---

### 08-multi-file-validation/ 🔀

Demonstrates multi-file linting with variadic arguments.

**Try it:**

```bash
cd 08-multi-file-validation
mdite lint core/api.md core/cli.md core/config.md
mdite lint core/*.md --depth 1
```

**Expected:**

- ✅ All specified files validated as entry points (depth 0)
- ✅ shared.md found (linked from all core files)
- ❌ orphan.md detected (not linked from any entry point)
- **Exit code: 1** (orphan detected)

**Features demonstrated:**

- Linting multiple specific files simultaneously
- Each file starts at depth 0
- Graph merging and deduplication
- Perfect for pre-commit hooks: `mdite lint $(git diff --cached --name-only | grep '\.md$')`
- Selective validation of documentation sections

**Use cases:**

- Pre-commit hooks (lint only changed files)
- CI/CD parallel validation
- Selective section validation
- Author workflow for related docs

---

### 09-file-exclusion/ 🚫

Comprehensive demonstration of file exclusion capabilities.

Demonstrates 6 different exclusion methods:

- **cli-exclude/** - CLI `--exclude` flags for runtime exclusion
- **config-exclude/** - Config file `exclude` array
- **mditeignore/** - `.mditeignore` file (project-wide patterns)
- **gitignore-respect/** - `--respect-gitignore` flag
- **negation/** - Negation patterns (`!pattern`) to re-include files
- **combined/** - Multiple exclusion sources with precedence

**Try it:**

```bash
cd 09-file-exclusion/cli-exclude
mdite lint --exclude "drafts/**" --exclude "*.draft.md"

cd ../mditeignore
mdite lint  # Uses .mditeignore file
```

**Expected:** Files matching patterns are excluded from validation, not counted as orphans

**Features demonstrated:**

- Gitignore-style pattern matching
- CLI exclusion flags (`--exclude`, `--respect-gitignore`)
- Config file exclusion (`exclude` array)
- `.mditeignore` file support
- Negation patterns for re-inclusion
- Pattern precedence (CLI > Config > .mditeignore > .gitignore)
- Early directory exclusion optimization
- Hidden directory exclusion control

---

### 10-cat-output/ 📤

Demonstrates the `mdite cat` command for outputting documentation content.

Shows how to:

- Output files in dependency order (default)
- Output in alphabetical order
- Generate JSON format with metadata
- Use custom separators
- Pipe to Unix tools

**Try it:**

```bash
cd 10-cat-output

# Default: dependency order
mdite cat

# Alphabetical order
mdite cat --order alpha

# JSON with metadata
mdite cat --format json

# Custom separator
mdite cat --separator "\n---\n"

# Pipe to tools
mdite cat | wc -w  # Count words
mdite cat | grep "install"  # Search
mdite cat --format json | jq '.[] | .wordCount'  # Extract metadata
```

**Expected:** ✅ Content output with correct ordering and format

**Features demonstrated:**

- Content output in dependency order
- Alphabetical ordering
- JSON format with metadata (file, depth, content, wordCount, lineCount)
- Custom separators between files
- Unix pipe compatibility
- Stdout/stderr separation

**Use cases:**

- Export documentation as single file
- Pipe to pandoc for PDF generation
- Count statistics across documentation
- Search across all connected docs

---

### 11-scope-limiting/ 🎯

Demonstrates the scope limiting feature that restricts validation to specific directory trees.

Shows how to:

- Validate only files within the entrypoint's directory (default behavior)
- Handle external links (links outside scope) with different policies
- Use `--no-scope-limit` to validate everything
- Set explicit scope boundaries with `--scope-root`
- Multi-file mode with automatic scope determination

**Try it:**

```bash
cd 11-scope-limiting

# Default scoped validation - only validates docs/api/**
mdite lint docs/api/README.md

# Default scoped validation - only validates docs/guides/**
mdite lint docs/guides/README.md

# External links policy - warn
mdite lint docs/guides/README.md --external-links warn

# External links policy - error
mdite lint docs/guides/README.md --external-links error

# Unlimited traversal (classic mdite behavior)
mdite lint docs/guides/README.md --no-scope-limit

# Explicit scope root
mdite lint docs/api/README.md --scope-root docs

# Multi-file mode (common ancestor scope)
mdite lint docs/api/README.md docs/guides/README.md
```

**Expected:**

- ✅ Scoped validation limits traversal to directory tree
- ⚠️ External links can be validated, warned, or errored based on policy
- ✅ Opt-out available with `--no-scope-limit`

**Features demonstrated:**

- Directory-scoped validation by default
- External link policies (validate, warn, error, ignore)
- Scope boundary detection
- Multi-file mode with common ancestor
- Orphan detection within scope
- Explicit scope root setting

**Use cases:**

- Validate documentation sections independently
- Monorepo with multiple doc sets
- Pre-commit hooks (validate only changed files)
- Strict boundary enforcement between doc sections

---

### 12-files-command/ 📋

Demonstrates the `mdite files` command - a graph-filtered file list provider that follows Unix philosophy.

**Try it:**

```bash
cd 12-files-command

# Basic listing
mdite files

# Depth filtering
mdite files --depth 1

# Frontmatter filtering (JMESPath queries)
mdite files --frontmatter "status=='published'"
mdite files --frontmatter "contains(tags, 'api')"

# Orphan detection
mdite files --orphans

# Output formats
mdite files --format json
mdite files --with-depth
mdite files --print0  # For xargs -0

# Sorting
mdite files --sort depth
mdite files --sort incoming
mdite files --sort outgoing

# Unix composition
mdite files | xargs rg "API"
mdite files --frontmatter "status=='published'" | xargs wc -w
```

**Expected:** ✅ File lists filtered by graph, metadata, and depth

**Features demonstrated:**

- Graph-filtered file listing
- Depth filtering
- Frontmatter metadata queries with JMESPath
- Orphan file detection
- Multiple output formats (list, JSON)
- Depth annotation
- Null-separated output for xargs
- Sorting by depth, incoming/outgoing links, alphabetical
- Unix tool composition (ripgrep, sed, wc, etc.)

**Use cases:**

- Graph-aware search: `mdite files | xargs rg "pattern"`
- Bulk operations: `mdite files --frontmatter "status=='draft'" | xargs sed -i 's/old/new/'`
- Metadata filtering combined with graph operations
- Find and archive orphaned files
- Statistics and analysis across filtered docs

**Philosophy:**

Following Unix philosophy, `mdite files` provides graph-filtered lists that compose with ANY Unix tool (ripgrep, sed, awk, custom scripts) rather than reimplementing search/transform functionality.

---

## Running All Examples (Smoke Test)

```bash
# Run smoke test suite
chmod +x run-all-examples.sh
./run-all-examples.sh
```

This runs mdite against all examples and verifies expected behavior (both passing and failing cases).

## Comparison with tests/fixtures/

| Directory         | Purpose                          | Audience           | Usage      |
| ----------------- | -------------------------------- | ------------------ | ---------- |
| `tests/fixtures/` | Automated unit/integration tests | Developers         | Via Vitest |
| `examples/`       | Manual testing + documentation   | Users + Developers | Via CLI    |

**Key differences:**

- `tests/fixtures/` - Minimal, focused test cases for automated testing
- `examples/` - Realistic, documented examples for manual exploration and smoke testing

## Tips for Using Examples

- Use `--format json` to see machine-readable output:

  ```bash
  mdite lint --format json
  ```

- Try the `deps` command to explore the dependency graph:

  ```bash
  mdite deps README.md
  ```

- Modify examples to experiment with different scenarios

- Use `--verbose` for detailed output:
  ```bash
  mdite lint --verbose
  ```

## Adding New Examples

When adding examples:

1. Keep them **minimal** but realistic
2. Include a **.mditerc** or **mdite.config.js**
3. Add **clear comments** explaining the scenario
4. Update this README
5. Add to **run-all-examples.sh** if relevant

## Development Workflow

For mdite developers working locally:

```bash
# Build and link mdite
npm run build
npm link

# Test against examples
cd examples/01-valid-docs
mdite lint

# Make changes to mdite...
# Rebuild
cd ../..
npm run build

# Test again
cd examples/01-valid-docs
mdite lint
```

## Success Criteria

After running examples, you should see:

**Phase 1: Core Examples**

- ✅ **01-valid-docs/** - Clean run with no errors
- ❌ **02-orphan-files/** - Detects 1 orphaned file
- ❌ **03-broken-links/** - Detects 2 broken links
- ❌ **04-broken-anchors/** - Detects 2 broken anchors

**Phase 2: Real-World + Config Variations**

- ✅ **05-real-world/** - Complete documentation site, no errors
- ✅ **06-config-variations/\*** - All config formats work correctly

**Phase 3: Edge Cases**

- ✅ **07-edge-cases/cycles/** - Handles circular references
- ✅ **07-edge-cases/deep-nesting/** - Handles deep paths
- ✅ **07-edge-cases/special-chars/** - Handles special characters

**Phase 4: Advanced Features**

- ✅ **08-depth-limiting/** - Depth limiting feature (unlimited depth, no orphans)
- ❌ **08-multi-file-validation/** - Multi-file linting (detects 1 orphan)
- ✅ **09-file-exclusion/\*** - All exclusion methods work correctly

**Phase 5: Content Output**

- ✅ **10-cat-output/** - Content output with different orderings and formats

**Phase 6: Scope Limiting**

- ✅ **11-scope-limiting/** - Scoped validation with external link policies

**Phase 7: Files Command**

- ✅ **12-files-command/** - File listing with graph, depth, and frontmatter filtering

All examples working correctly = mdite is functioning as expected! 🎉

## Directory Structure

```
examples/
├── README.md                          # This file
├── run-all-examples.sh               # Smoke test runner
│
├── 01-valid-docs/                    # ✅ Phase 1: Core Examples
├── 02-orphan-files/
├── 03-broken-links/
├── 04-broken-anchors/
│
├── 05-real-world/                    # 🌍 Phase 2: Real-World
│   ├── docs/
│   │   ├── tutorials/
│   │   ├── guides/
│   │   └── api-reference/
│   ├── mdite.config.js
│   └── package.json
│
├── 06-config-variations/             # ⚙️ Phase 2: Config Variations
│   ├── minimal/
│   ├── strict/
│   ├── warnings/
│   └── package-json/
│
├── 07-edge-cases/                    # 🔄 Phase 3: Edge Cases
│   ├── cycles/
│   ├── deep-nesting/
│   └── special-chars/
│
├── 08-depth-limiting/                # 📏 Depth Limiting Feature
│   └── docs/
│       ├── getting-started.md
│       └── level2/
│           ├── setup.md
│           └── level3/
│               └── advanced.md
│
├── 08-multi-file-validation/         # 🔀 Multi-File Validation
│   ├── README.md
│   ├── core/
│   │   ├── api.md
│   │   ├── cli.md
│   │   └── config.md
│   ├── shared.md
│   └── orphan.md
│
├── 09-file-exclusion/                # 🚫 File Exclusion
│   ├── cli-exclude/
│   ├── config-exclude/
│   ├── mditeignore/
│   ├── gitignore-respect/
│   ├── negation/
│   └── combined/
│
├── 10-cat-output/                    # 📤 Content Output
│   └── docs/
│       ├── README.md
│       ├── installation.md
│       └── configuration.md
│
├── 11-scope-limiting/                # 🎯 Scope Limiting
│   ├── docs/
│   │   ├── api/
│   │   │   ├── README.md
│   │   │   ├── endpoints.md
│   │   │   └── methods.md
│   │   └── guides/
│   │       ├── README.md
│   │       ├── setup.md
│   │       └── tutorial.md
│   └── root-README.md
│
└── 12-files-command/                 # 📋 Files Command
    ├── README.md
    ├── api.md
    ├── tutorial.md
    ├── draft.md
    ├── archive.md
    └── orphan.md
```
