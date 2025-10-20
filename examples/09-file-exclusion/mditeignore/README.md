# .mditeignore File Example

This example demonstrates using `.mditeignore` file for exclusions.

## Documentation

- [Documentation](./docs.md) - Main documentation

## Configuration

See `.mditeignore`:

```gitignore
# .mditeignore - mdite exclusion patterns
# Syntax: gitignore-compatible

# Exclude drafts directory
drafts/

# Exclude temporary files
*.temp.md
*.draft.md

# Exclude scratch directory
scratch/
```

## Files

- `README.md` - This file (entrypoint)
- `docs.md` - Regular documentation (included)
- `drafts/feature.draft.md` - Draft (excluded by .mditeignore)
- `notes.temp.md` - Temp file (excluded by .mditeignore)
- `scratch/ideas.md` - Scratch (excluded by .mditeignore)

## Test Command

```bash
mdite lint
```

The `.mditeignore` file is automatically detected!

## Expected Results

- ✅ `.mditeignore` patterns automatically loaded
- ✅ Comments and blank lines handled
- ✅ No orphan warnings for excluded files
- ✅ Zero errors

## Advantages

- Gitignore-style syntax (familiar to developers)
- Auto-detected (no CLI flags needed)
- Supports comments for documentation
- Version controlled with project
- Standard location (project root)
