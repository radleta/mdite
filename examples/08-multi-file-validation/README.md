# Example 08: Multi-File Validation

This example demonstrates **multi-file linting** - the ability to lint multiple entry points simultaneously using variadic arguments.

## What This Demonstrates

- Linting multiple specific files as entry points
- Each file starts at depth 0
- Results are merged and deduplicated
- Orphan detection works across all entry points
- Depth limiting applies to all files
- Perfect for pre-commit hooks and selective validation

## Files Structure

```
examples/08-multi-file-validation/
├── README.md (this file)
├── core/
│   ├── api.md         # Entry point 1 - links to shared.md
│   ├── cli.md         # Entry point 2 - links to shared.md
│   └── config.md      # Entry point 3 - links to shared.md
├── shared.md          # Shared by all core files
└── orphan.md          # Not linked by any core file
```

## Expected Results

### Test 1: Lint Multiple Core Files

```bash
cd examples/08-multi-file-validation
mdite lint core/api.md core/cli.md core/config.md
```

**Expected:**

- ✅ All 3 core files validated
- ✅ shared.md found (linked from all 3)
- ❌ orphan.md detected as orphaned (not linked from any)
- **Exit code: 1** (orphan detected)

### Test 2: Lint with Depth Limit

```bash
mdite lint core/api.md core/cli.md core/config.md --depth 1
```

**Expected:**

- ✅ All 3 core files (depth 0)
- ✅ shared.md (depth 1 from all 3)
- ❌ orphan.md detected as orphaned
- **Exit code: 1** (orphan detected)

### Test 3: JSON Output

```bash
mdite lint core/api.md core/cli.md --format json
```

**Expected:**

- Valid JSON array with error objects
- Contains orphan errors
- Mergeable results from multiple entry points

### Test 4: Verbose Mode

```bash
mdite lint core/api.md core/cli.md core/config.md --verbose
```

**Expected:**

- Shows list of files being linted
- Shows detailed traversal information
- Shows shared.md found from all entry points

## Use Cases

### Pre-Commit Hook

```bash
# Lint only changed markdown files
CHANGED=$(git diff --cached --name-only --diff-filter=ACM | grep '\.md$')
mdite lint $CHANGED --depth 1
```

### Validate Specific Sections

```bash
# Validate core docs without full traversal
mdite lint core/*.md --depth 1
```

### CI/CD Selective Validation

```bash
# Parallel validation of independent sections
mdite lint docs/api/*.md --format json
```

## Key Concepts

1. **Multiple Entry Points**: Each file specified starts at depth 0
2. **Graph Merging**: Files appearing in multiple graphs use minimum depth
3. **Orphan Detection**: Files not reachable from ANY entry point are orphans
4. **Deduplication**: Link errors from multiple graphs are deduplicated
5. **Backward Compatible**: Single file still works as before

## Running the Example

```bash
# From examples/08-multi-file-validation/
mdite lint core/api.md core/cli.md core/config.md

# Should show:
# - 4 reachable files (3 core + shared.md)
# - 1 orphan (orphan.md)
# - Exit code 1
```
