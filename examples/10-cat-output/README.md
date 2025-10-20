# Example 10: Content Output (`mdite cat`)

This example demonstrates the `mdite cat` command for outputting documentation content.

## Structure

```
README.md (entrypoint)
├── getting-started.md
│   └── installation.md
└── api-reference.md
```

## What This Demonstrates

- **Dependency order output** - Files ordered by dependencies
- **Alphabetical order output** - Files sorted alphabetically
- **JSON format** - Structured output with metadata
- **Custom separators** - Different separators between files
- **Pipe-friendly output** - Works with Unix tools

## Commands to Try

### 1. Output in Dependency Order (Default)

```bash
mdite cat
```

Files are output in dependency order (dependencies before dependents):

- `installation.md` (depth 2)
- `getting-started.md` (depth 1)
- `api-reference.md` (depth 1)
- `README.md` (depth 0)

### 2. Output in Alphabetical Order

```bash
mdite cat --order alpha
```

Files are sorted alphabetically:

- `README.md`
- `api-reference.md`
- `getting-started.md`
- `installation.md`

### 3. JSON Format with Metadata

```bash
mdite cat --format json
```

Outputs structured data including:

- File path (relative)
- Depth in graph
- Content
- Word count
- Line count

### 4. Custom Separator

```bash
mdite cat --separator "\n---\n"
```

Uses custom separator between files.

### 5. Pipe to Other Tools

```bash
# Count total words
mdite cat | wc -w

# Count total lines
mdite cat | wc -l

# Search across all docs
mdite cat | grep "install"

# Extract headings
mdite cat | grep "^#"

# JSON analysis with jq
mdite cat --format json | jq '[.[] | .wordCount] | add'
```

## Expected Results

All commands should succeed with:

- Clean output to stdout
- Progress messages to stderr (unless `--quiet`)
- Exit code 0

## Use Cases

This example demonstrates real-world use cases:

1. **Documentation export** - Create single-file documentation
2. **Content analysis** - Pipe to analysis tools
3. **Build pipelines** - Generate PDFs, HTML, etc.
4. **Statistics** - Count words, lines, etc. across documentation
5. **Search** - Find content across all connected docs
