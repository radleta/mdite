# Existing Document

This file exists, so links to it are valid. ✅

## Valid References

The [README](./README.md) contains a link to this file. That link works because:
- This file exists at the expected path
- The link uses the correct filename
- The relative path is correct

## Broken References

However, the README also contains links to files that don't exist:
- `missing.md` - File doesn't exist
- `../outside-document.md` - File doesn't exist

## Link Validation

doc-lint validates that:
- ✅ Links point to files that exist
- ✅ Relative paths resolve correctly
- ✅ File extensions match (`.md`)

## Fixing Broken Links

To fix broken links, you can:

1. **Create the missing file** - Write the content that should exist
2. **Update the link** - Fix the path if it's incorrect
3. **Remove the link** - If the content is no longer needed

## Testing Links

When you run `doc-lint lint`, it will:
1. Parse all markdown files
2. Extract link references
3. Resolve relative paths
4. Check file existence
5. Report any dead links

## Best Practices

To avoid broken links:
- Use consistent naming conventions
- Update links when moving files
- Verify links after creating them
- Run doc-lint regularly in CI/CD

## Return

Back to [README](./README.md)
