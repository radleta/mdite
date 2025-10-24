# Gitignore Respect Example

Demonstrates respecting existing `.gitignore` file.

## Documentation

- [Guide](./guide.md) - User guide

## Test Command

```bash
mdite lint --respect-gitignore
```

## Files

- `README.md` - Entrypoint
- `guide.md` - Included
- `drafts/wip.md` - Excluded (by .gitignore)

## Expected: Drafts excluded when using `--respect-gitignore`
