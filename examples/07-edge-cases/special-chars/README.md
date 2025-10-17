# Special Characters Example

This example demonstrates how mdite handles files with special characters in their names.

## Overview

File names can contain various special characters. mdite should handle them gracefully.

## Files in This Example

This directory contains files with different naming patterns:

### Standard Names
- [README.md](./README.md) (this file)
- [simple.md](./simple.md) - Simple alphanumeric name

### Hyphens and Underscores
- [file-with-hyphens.md](./file-with-hyphens.md) - Common in URLs
- [file_with_underscores.md](./file_with_underscores.md) - Common in code

### Numbers
- [file123.md](./file123.md) - Contains numbers
- [123-numbers-first.md](./123-numbers-first.md) - Starts with numbers

### Mixed Patterns
- [mixed-Case_File123.md](./mixed-Case_File123.md) - Mixed case, hyphens, underscores, numbers

## Why This Matters

Special characters in filenames test:
- **URL Encoding** - Some characters need encoding in links
- **Case Sensitivity** - Filesystem may be case-sensitive or not
- **Parsing** - Link extraction must handle various formats
- **Path Resolution** - Special chars in paths must resolve correctly

## Common Special Characters

### Safe Characters (widely supported)
- Hyphens: `file-name.md` ✅
- Underscores: `file_name.md` ✅
- Numbers: `file123.md` ✅
- Dots: `file.name.md` ✅

### Characters to Avoid
- Spaces: `file name.md` (use hyphens or underscores instead)
- Special symbols: `file@#$.md` (not recommended)
- Reserved characters: `<>:"/\\|?*` (not allowed on some systems)

## Expected Behavior

When running `mdite lint`:
- ✅ Should handle all valid filename characters
- ✅ Should parse links with special characters correctly
- ✅ Should validate files regardless of naming pattern
- ✅ Should not be confused by hyphens, underscores, or numbers

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

## Best Practices

For maximum compatibility:
- **Use lowercase** - Avoid case-sensitivity issues
- **Use hyphens** - More URL-friendly than underscores
- **Avoid spaces** - Replace with hyphens
- **Be consistent** - Pick a naming convention and stick to it

## Real-World Scenarios

Special characters appear in:
- Documentation generated from code (underscores)
- SEO-friendly URLs (hyphens)
- Version numbers (dots and numbers)
- Multi-word file names (hyphens or underscores)

## Navigation

Explore files with special characters:
- [Simple name](./simple.md)
- [Hyphens](./file-with-hyphens.md)
- [Underscores](./file_with_underscores.md)
- [Numbers](./file123.md)
- [Numbers first](./123-numbers-first.md)
- [Mixed pattern](./mixed-Case_File123.md)

All links should work correctly!
