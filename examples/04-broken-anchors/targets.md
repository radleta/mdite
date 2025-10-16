# Targets Document

This document contains headings that are referenced from the [README](./README.md).

## Valid Section

This section exists and can be linked to. ✅

The README contains a link to this section using:
```markdown
[Valid Section in Targets](./targets.md#valid-section)
```

The anchor `#valid-section` is generated from the heading `## Valid Section` using GitHub-style slugification:
- Convert to lowercase: "valid section"
- Replace spaces with hyphens: "valid-section"

## Another Valid Section

This is another section that exists. It could be referenced with:
```markdown
[Another Valid Section](./targets.md#another-valid-section)
```

## Anchor Slug Rules

GitHub-style slugs follow these rules:

1. **Lowercase** - All characters converted to lowercase
2. **Spaces to Hyphens** - Spaces become `-`
3. **Special Characters** - Most special characters are removed
4. **Punctuation** - Some punctuation like colons and parentheses are removed

### Examples

| Heading | Slug |
|---------|------|
| `## Installation` | `#installation` |
| `## Getting Started` | `#getting-started` |
| `## API Reference` | `#api-reference` |
| `## Step 1: Setup` | `#step-1-setup` |
| `## FAQ (Frequently Asked Questions)` | `#faq-frequently-asked-questions` |

## Non-Existent Reference

The README tries to link to `#non-existent-section` in this file, but that heading doesn't exist. This will be detected as a broken anchor. ❌

To fix it, you could either:
1. Add a heading called `## Non-Existent Section` to this file
2. Update the link in README to point to an existing section
3. Remove the link from README

## Testing Anchors

When mdite validates anchors:
1. It parses markdown to extract all headings
2. Generates slugs for each heading using GitHub rules
3. Compares link anchors against the slug list
4. Reports mismatches as errors

## Best Practices

To maintain valid anchors:
- Keep heading names stable (avoid frequent renaming)
- Use descriptive but concise headings
- Test links after restructuring documents
- Run mdite in CI/CD to catch broken anchors early

## Return

Back to [README](./README.md)
