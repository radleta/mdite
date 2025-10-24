# Negation Pattern Example

Demonstrates negation patterns (`!`) to re-include files.

## Documentation

- [Important Draft](./drafts/important.md) - Re-included via negation

## Test Command

```bash
mdite lint
```

## Files

- `README.md` - Entrypoint
- `drafts/wip.md` - Excluded (by `drafts/`)
- `drafts/important.md` - **Included** (by `!drafts/important.md`)

## Pattern Explanation

1. `drafts/` - Excludes entire directory
2. `!drafts/important.md` - Re-includes this specific file

Note: Negation works at file level. Cannot re-include if parent directory structure is excluded.
