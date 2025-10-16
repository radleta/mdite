# Circular References Example

This example demonstrates how doc-lint handles circular link references.

## What is a Circular Reference?

A circular reference occurs when documents link in a cycle:
- A links to B
- B links to C
- C links back to A

This creates a cycle: A → B → C → A

## The Cycle in This Example

This documentation set contains a deliberate cycle:

1. **[README.md](./README.md)** (this file) → links to [page-a.md](./page-a.md)
2. **[page-a.md](./page-a.md)** → links to [page-b.md](./page-b.md)
3. **[page-b.md](./page-b.md)** → links to [page-c.md](./page-c.md)
4. **[page-c.md](./page-c.md)** → links back to [page-a.md](./page-a.md)

```
README → page-a → page-b → page-c
           ↑                  │
           └──────────────────┘
```

## Why This Matters

Graph traversal algorithms must handle cycles to avoid:
- **Infinite loops** - Visiting the same nodes forever
- **Stack overflow** - Recursive calls without termination
- **Hanging** - Tool never completes

## How doc-lint Handles Cycles

doc-lint uses cycle detection:
1. Track visited files
2. Skip files already visited
3. Continue traversal without re-entering cycle
4. Complete successfully

## Expected Behavior

When running `doc-lint lint`:
- ✅ Should complete without hanging
- ✅ Should find all 4 files (README + 3 pages)
- ✅ Should not infinite loop
- ✅ Should report no errors (all links valid)

## Try It

```bash
doc-lint lint
```

Should output:
```
✓ Found 4 reachable files
✓ No orphaned files
✓ All links valid
```

## Real-World Scenarios

Circular references occur naturally in documentation:
- Navigation breadcrumbs
- Cross-references between related topics
- Index pages linking to categories and back

## Graph Visualization

```
        README.md
            │
            v
        page-a.md  ←──────┐
            │              │
            v              │
        page-b.md          │
            │              │
            v              │
        page-c.md  ────────┘
```

All files are reachable, and the cycle is handled correctly.

## Navigation

- [Start exploring: Page A](./page-a.md)
- [Jump to Page B](./page-b.md)
- [Go to Page C](./page-c.md)
