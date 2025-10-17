# Edge Cases Examples

This directory contains examples demonstrating how mdite handles complex and edge-case scenarios.

## Overview

These examples test mdite's robustness with:
- Circular references
- Deep directory nesting
- Special characters in filenames

## Examples

### cycles/

Demonstrates handling of circular link references (A→B→C→A).

**Purpose:** Verify mdite doesn't infinite loop on cycles
**Expected:** Tool completes successfully, detects all files in cycle

```bash
cd cycles && mdite lint
```

### deep-nesting/

Tests deeply nested directory structures.

**Purpose:** Verify correct relative path resolution
**Expected:** Tool handles deep paths correctly

```bash
cd deep-nesting && mdite lint
```

### special-chars/

Tests files with special characters in names.

**Purpose:** Verify mdite handles various filename characters
**Expected:** Tool processes all filenames correctly

```bash
cd special-chars && mdite lint
```

## Why Test Edge Cases?

Edge cases reveal:
- **Robustness** - Does the tool handle unusual inputs?
- **Correctness** - Are edge cases processed correctly?
- **Performance** - Does the tool handle complex scenarios efficiently?

## Expected Behavior

All edge case examples should:
- ✅ Complete without hanging or crashing
- ✅ Process all files correctly
- ✅ Report accurate results
- ✅ Handle unusual scenarios gracefully

## Try Them All

```bash
# Test cycles
cd cycles && mdite lint

# Test deep nesting
cd deep-nesting && mdite lint

# Test special characters
cd special-chars && mdite lint
```

## Related

- [Real World Example](../05-real-world/README.md) - Realistic documentation
- [Main Examples](../README.md) - All examples
