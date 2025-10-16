# Orphaned Document

**⚠️ This file is intentionally orphaned for demonstration purposes.**

## What Makes This an Orphan?

This file exists in the same directory as `README.md` and `connected.md`, but:
- ❌ It's not linked from README.md
- ❌ It's not linked from connected.md
- ❌ It's not linked from any other file in the graph

Therefore, it's unreachable from the entrypoint and will be detected as an orphan by doc-lint.

## Why This Is a Problem

Orphaned files are problematic because:
1. **Discoverability** - Users can't find this content
2. **Maintenance** - Forgotten files become outdated
3. **Confusion** - Unclear if the file should exist or be deleted

## Real-World Scenarios

Orphans often occur when:
- Documentation is reorganized but old files aren't deleted
- New files are created but never linked
- Files are unlinked during refactoring and forgotten

## How doc-lint Detects This

doc-lint:
1. Starts at the entrypoint (README.md)
2. Follows all relative markdown links recursively
3. Builds a graph of reachable files
4. Compares against all `.md` files in the directory
5. Reports files that aren't in the graph as orphans

## Try It

Run `doc-lint lint` in the `02-orphan-files` directory to see this file detected as an orphan.

To "fix" this example, you could link to this file from README.md:
```markdown
- [Orphaned Document](./orphaned.md) - Now it's connected!
```
