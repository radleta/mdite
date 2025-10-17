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
- ✅ **08-depth-limiting/** - Depth limiting feature (unlimited depth, no orphans)

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
└── 08-depth-limiting/                # 📏 Depth Limiting Feature
    └── docs/
        ├── getting-started.md
        └── level2/
            ├── setup.md
            └── level3/
                └── advanced.md
```
