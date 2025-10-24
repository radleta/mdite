# CLI Exclude Example

This example demonstrates using `--exclude` CLI flags for ad-hoc exclusions.

## Documentation

- [Guide](./guide.md) - User guide
- [API Reference](./api.md) - API documentation

## Files

- `README.md` - This file (entrypoint)
- `guide.md` - Regular documentation (included)
- `api.md` - Regular documentation (included)
- `drafts/feature.md` - Draft file (excluded)
- `drafts/idea.md` - Draft file (excluded)
- `scratch.temp.md` - Temporary file (excluded)
- `notes.temp.md` - Temporary file (excluded)

## Test Command

```bash
mdite lint --exclude "drafts/**" --exclude "*.temp.md"
```

## Expected Results

- ✅ No orphan warnings for `drafts/*.md` (excluded)
- ✅ No orphan warnings for `*.temp.md` (excluded)
- ✅ `guide.md` and `api.md` are validated (linked from README)
- ✅ Zero errors

## What This Demonstrates

1. **Multiple `--exclude` flags** can be used together
2. **Directory patterns** (`drafts/**`) exclude entire directories
3. **File patterns** (`*.temp.md`) exclude files by extension
4. **Orphan detection** skips excluded files
5. **Graph building** never includes excluded files

## Pattern Explanation

- `drafts/**` - Excludes all files in `drafts/` directory (recursive)
- `*.temp.md` - Excludes all files ending in `.temp.md` (any directory)
