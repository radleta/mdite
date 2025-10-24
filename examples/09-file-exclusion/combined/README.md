# Combined Approaches Example

Demonstrates using multiple exclusion sources together.

## Documentation

- [Guide](./guide.md) - User guide

## Sources

1. `.gitignore` - Excludes `dist/` and `*.log`
2. `.mditeignore` - Excludes `drafts/` and `*.draft.md`
3. `mdite.config.js` - Excludes `scratch/`
4. CLI flag - Excludes `temp/**`

## Test Command

```bash
mdite lint --exclude "temp/**" --respect-gitignore
```

## Files

- `README.md` - Included
- `guide.md` - Included
- `drafts/wip.md` - Excluded (.mditeignore)
- `scratch/ideas.md` - Excluded (config)
- `temp/notes.md` - Excluded (CLI)
- `api.draft.md` - Excluded (.mditeignore)

## Precedence

All patterns are merged. CLI has highest priority for conflicts.
