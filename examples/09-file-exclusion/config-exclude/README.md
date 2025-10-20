# Config File Exclude Example

This example demonstrates using `exclude` array in config file.

## Documentation

- [Guide](./guide.md) - User guide

## Configuration

See `mdite.config.js`:

```javascript
export default {
  exclude: ['drafts/**', '*.temp.md', 'scratch/'],
};
```

## Files

- `README.md` - This file (entrypoint)
- `guide.md` - Regular documentation (included)
- `drafts/wip.md` - Draft (excluded by config)
- `notes.temp.md` - Temp file (excluded by config)
- `scratch/ideas.md` - Scratch file (excluded by config)

## Test Command

```bash
mdite lint
```

No `--exclude` flag needed - patterns are in config!

## Expected Results

- ✅ Config patterns automatically applied
- ✅ No orphan warnings for excluded files
- ✅ `guide.md` validated
- ✅ Zero errors

## Advantages

- Patterns stored in version control
- Consistent across team members
- No need to remember CLI flags
- Project-specific exclusions
