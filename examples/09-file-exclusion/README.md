# Example 09: File Exclusion

This example demonstrates mdite's file exclusion capabilities, allowing you to exclude specific files and directories from validation using gitignore-style patterns.

## Overview

mdite supports multiple ways to exclude files:

1. **CLI flags** (`--exclude`) - Ad-hoc exclusions
2. **Config file** (`exclude` array) - Project-specific exclusions
3. **`.mditeignore` file** - Gitignore-style ignore file (auto-detected)
4. **`.gitignore` file** - Respect existing .gitignore (opt-in with `--respect-gitignore`)
5. **Negation patterns** (`!pattern`) - Re-include previously excluded files
6. **Combined approaches** - Use multiple sources together

## Precedence

When patterns conflict, they are merged with this precedence (highest to lowest):

1. CLI `--exclude` patterns
2. Config `exclude` array
3. `.mditeignore` patterns
4. `.gitignore` patterns (if enabled)
5. Built-in defaults (`node_modules/`, hidden directories)

## Built-in Exclusions

By default, mdite excludes:

- `node_modules/` directory
- Hidden directories (starting with `.`)

You can disable hidden directory exclusion with `--no-exclude-hidden`.

## Sub-examples

### 1. CLI Exclude (`cli-exclude/`)

Demonstrates using `--exclude` flag for ad-hoc exclusions.

**Usage:**

```bash
cd cli-exclude
mdite lint --exclude "drafts/**" --exclude "*.temp.md"
```

**What it shows:**

- Multiple `--exclude` flags
- Wildcard patterns (`**`, `*`)
- Excluded files don't trigger orphan warnings
- Excluded files aren't validated

### 2. Config File Exclude (`config-exclude/`)

Demonstrates using `exclude` array in config file.

**Usage:**

```bash
cd config-exclude
mdite lint
```

**What it shows:**

- `exclude` array in `mdite.config.js`
- Project-level exclusions
- Automatic application without CLI flags

### 3. .mditeignore File (`mditeignore/`)

Demonstrates using `.mditeignore` file (gitignore syntax).

**Usage:**

```bash
cd mditeignore
mdite lint
```

**What it shows:**

- `.mditeignore` file with gitignore patterns
- Comments and blank lines
- Directory exclusions with trailing `/`
- File pattern exclusions

### 4. Gitignore Respect (`gitignore-respect/`)

Demonstrates respecting existing `.gitignore` file.

**Usage:**

```bash
cd gitignore-respect
mdite lint --respect-gitignore
```

**What it shows:**

- `--respect-gitignore` flag
- Using existing `.gitignore` patterns
- Combining git and mdite exclusions

### 5. Negation Patterns (`negation/`)

Demonstrates negation patterns to re-include files.

**Usage:**

```bash
cd negation
mdite lint
```

**What it shows:**

- Exclude a directory: `drafts/`
- Re-include specific file: `!drafts/important.md`
- Negation pattern limitations (can't re-include if parent excluded)

### 6. Combined Approaches (`combined/`)

Demonstrates using multiple exclusion sources together.

**Usage:**

```bash
cd combined
mdite lint --exclude "temp/**" --respect-gitignore
```

**What it shows:**

- `.mditeignore` file
- `.gitignore` file
- Config file exclusions
- CLI flag exclusions
- Pattern precedence and merging

## Testing All Examples

Run all exclusion examples:

```bash
cd examples/09-file-exclusion

# Test each sub-example
for dir in cli-exclude config-exclude mditeignore gitignore-respect negation combined; do
  echo "Testing $dir..."
  cd $dir
  mdite lint
  cd ..
done
```

## Expected Behavior

### Files That Should Be Excluded

- Drafts directory contents
- Temporary files (`*.temp.md`, `*.draft.md`)
- Scratch/work-in-progress directories
- Files matching custom patterns

### Files That Should NOT Be Excluded

- Regular documentation files
- Explicitly re-included files (via negation)
- Files outside exclusion patterns

## Common Patterns

Here are common exclusion patterns:

```gitignore
# Drafts and WIP
drafts/
*.draft.md
*.wip.md

# Temporary files
temp/
scratch/
*.temp.md

# Generated docs
_generated/
dist/docs/

# Templates
templates/
_template-*.md

# Test files
**/*.test.md

# Specific file
path/to/file.md

# Re-include (negation)
!important-draft.md
```

## Pattern Syntax

mdite uses gitignore-compatible patterns:

- `*` - Matches any characters except `/`
- `**` - Matches zero or more directories
- `?` - Matches single character
- `[abc]` - Character ranges
- `!pattern` - Negation (re-include)
- `#` - Comments
- Trailing `/` - Matches directories only

## Performance

File exclusion improves performance by:

- Skipping excluded directories during traversal
- Reducing files in dependency graph
- Fewer files to validate
- Pattern matching overhead is minimal (<5%)

## Troubleshooting

### Files Still Being Validated

1. Check pattern syntax (use forward slashes `/`)
2. Verify pattern precedence
3. Use `--verbose` to see applied patterns
4. Test pattern: `mdite lint --exclude "your/pattern/**"`

### Negation Not Working

1. Negation cannot re-include if parent directory excluded
2. Use more specific patterns instead:

   ```gitignore
   # Instead of:
   drafts/
   !drafts/keep.md  # Won't work

   # Use:
   drafts/*.md
   drafts/**/*.md
   !drafts/keep.md  # Works
   ```

### Performance Issues

If you have many patterns (100+):

1. Combine patterns with wildcards
2. Use directory-level exclusions
3. Check for redundant patterns

## Related Examples

- Example 01: Valid docs (baseline)
- Example 02: Orphan files (compare with exclusions)
- Example 06: Config variations (other config options)
