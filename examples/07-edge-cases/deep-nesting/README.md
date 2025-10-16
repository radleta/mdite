# Deep Nesting Example

This example demonstrates how mdite handles deeply nested directory structures.

## Directory Structure

This example uses a deep directory hierarchy:

```
README.md (entrypoint)
└── docs/
    └── guides/
        └── advanced/
            └── topics/
                └── specific/
                    └── detail.md (deeply nested file)
```

## Deep Path

The deeply nested file is at:
```
./docs/guides/advanced/topics/specific/detail.md
```

That's **6 levels deep** from the root!

## Relative Path Resolution

The challenge with deep nesting is relative path resolution:
- From README → detail.md: `./docs/guides/advanced/topics/specific/detail.md`
- From detail.md → README: `../../../../../README.md`

mdite must correctly resolve these relative paths.

## Navigation

Explore the deep structure:
- [Docs Index](./docs/index.md)
- [Guides](./docs/guides/index.md)
- [Advanced Guide](./docs/guides/advanced/index.md)
- [Topics](./docs/guides/advanced/topics/index.md)
- [Specific Topic](./docs/guides/advanced/topics/specific/index.md)
- [Detail Page](./docs/guides/advanced/topics/specific/detail.md) (deepest level)

## Why This Matters

Deep nesting tests:
- **Path Resolution** - Correct handling of `../` sequences
- **File Discovery** - Finding files at any depth
- **Link Validation** - Validating links across many directory levels
- **Performance** - Efficient traversal of deep structures

## Expected Behavior

When running `mdite lint`:
- ✅ Should find all files regardless of depth
- ✅ Should correctly resolve relative paths
- ✅ Should validate links across directory levels
- ✅ Should not be confused by deep nesting

## Try It

```bash
mdite lint
```

Should output:
```
✓ Found 7 reachable files
✓ No orphaned files
✓ All links valid
```

## Real-World Scenarios

Deep nesting occurs in:
- Large documentation sites with hierarchical organization
- API documentation with namespace hierarchies
- Multi-level topic categorization
- Complex product documentation

## Visual Structure

```
📁 deep-nesting/
├── 📄 README.md (you are here)
└── 📁 docs/
    ├── 📄 index.md
    └── 📁 guides/
        ├── 📄 index.md
        └── 📁 advanced/
            ├── 📄 index.md
            └── 📁 topics/
                ├── 📄 index.md
                └── 📁 specific/
                    ├── 📄 index.md
                    └── 📄 detail.md ⭐ (deepest)
```

## Start Exploring

Begin at [Docs Index](./docs/index.md) and navigate down to the deepest level.
