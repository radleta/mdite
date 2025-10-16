# Broken Links Example

This example demonstrates dead link detection in mdite.

## What is a Dead Link?

A dead link is a reference to a file that doesn't exist. Dead links create a poor user experience and indicate documentation maintenance issues.

## Links in This Document

This document contains both valid and broken links:

### Valid Link ✅

This link works because the file exists:
- [Existing Document](./existing.md) - This file exists

### Broken Links ❌

These links are broken because the files don't exist:

Here's a link to a missing file:
- [Missing Document](./missing.md) - This file does not exist

Here's a link outside this directory:
- [Outside Document](../outside-document.md) - This file does not exist

## Expected Output

When you run `mdite lint` on this directory:

```bash
mdite lint
```

You should see errors like:

```
✗ Found 2 link error(s)

README.md
  18:3 error Dead link: missing.md [dead-link]
  22:3 error Dead link: ../outside-document.md [dead-link]

✗ 2 error(s), 0 warning(s)
```

## Try It Yourself

1. Run `mdite lint` to see the broken links detected
2. Create `missing.md` and `../outside-document.md` to fix the errors
3. Run `mdite lint` again to verify they're fixed

## Why Dead Links Matter

Dead links are problems because:
- **User Experience** - Users click links and get 404-style errors
- **Trust** - Broken links make documentation seem unmaintained
- **Navigation** - Users can't reach important content

## How mdite Detects Dead Links

For each link in markdown files, mdite:
1. Resolves the relative path
2. Checks if the target file exists
3. Reports an error if the file is not found

## Common Causes

Dead links often occur when:
- Files are moved or renamed without updating links
- Files are deleted but references remain
- Links are created before the target file is written
- Typos in file paths

See [Existing Document](./existing.md) for more information.
