# Broken Anchors Example

This example demonstrates anchor/fragment link validation in doc-lint.

## What is a Dead Anchor?

A dead anchor is a link to a heading (section) that doesn't exist. Anchors use the `#` symbol to reference headings within the same file or in other files.

## Anchor Types

### Same-File Anchors

Links to headings within the same document:

Valid anchor (this heading exists):
- [What is a Dead Anchor?](#what-is-a-dead-anchor) ✅

Invalid anchor (this heading does NOT exist):
- [Non-Existent Section](#non-existent-section) ❌

### Cross-File Anchors

Links to headings in other documents:

Valid cross-file anchor:
- [Valid Section in Targets](./targets.md#valid-section) ✅

Invalid cross-file anchor:
- [Invalid Section in Targets](./targets.md#non-existent-section) ❌

## Expected Output

When you run `doc-lint lint` on this directory:

```bash
doc-lint lint
```

You should see errors like:

```
✗ Found 2 anchor error(s)

README.md
  19:3 error Dead anchor: #non-existent-section in README.md [dead-anchor]
  26:3 error Dead anchor: #non-existent-section in targets.md [dead-anchor]

✗ 2 error(s), 0 warning(s)
```

## Try It Yourself

1. Run `doc-lint lint` to see the broken anchors detected
2. Add headings with those names to fix the errors
3. Run `doc-lint lint` again to verify they're fixed

## How Anchor Slugs Work

Anchors are generated from headings using GitHub-style slugification:
- Convert to lowercase
- Replace spaces with hyphens
- Remove special characters

Examples:
- `## What is a Dead Anchor?` → `#what-is-a-dead-anchor`
- `## How It Works` → `#how-it-works`
- `## Step 1: Install` → `#step-1-install`

## Why Anchor Validation Matters

Broken anchors cause problems:
- **Navigation** - Users can't jump to referenced sections
- **User Experience** - Clicking a broken anchor is frustrating
- **Maintenance** - Headings may be renamed without updating links

## How doc-lint Validates Anchors

For each anchor link, doc-lint:
1. Identifies the target file (same file or different file)
2. Extracts all headings from the target file
3. Converts headings to GitHub-style slugs
4. Checks if the anchor matches any slug
5. Reports an error if no match is found

## Common Causes

Broken anchors often occur when:
- Headings are renamed without updating links
- Sections are removed but links remain
- Typos in anchor references
- Misunderstanding of slug generation rules

See [Targets Document](./targets.md) for more examples.
