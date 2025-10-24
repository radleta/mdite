---
status: published
tags:
  - guide
  - getting-started
priority: high
---

# Files Command Example

This example demonstrates the `mdite files` command - a graph-filtered file list provider that follows Unix philosophy.

## Links

- [API Documentation](./api.md)
- [Tutorial](./tutorial.md)
- [Draft Document](./draft.md)
- [Archive](./archive.md)

## What This Example Shows

1. **Basic file listing** - List all reachable files
2. **Depth filtering** - Filter by graph depth
3. **Frontmatter filtering** - Query metadata with JMESPath
4. **Orphan detection** - Find unreachable files
5. **Output formats** - JSON, annotated, null-separated
6. **Sorting** - By depth, incoming/outgoing links, alphabetical
7. **Unix composition** - Pipe to ripgrep, sed, etc.

## Try These Commands

### Basic Listing

```bash
# List all reachable files
mdite files

# List with absolute paths
mdite files --absolute

# List orphaned files
mdite files --orphans
```

### Depth Filtering

```bash
# Top-level docs only
mdite files --depth 1

# Up to depth 2
mdite files --depth 2
```

### Frontmatter Filtering

```bash
# Published docs only
mdite files --frontmatter "status=='published'"

# Draft docs only
mdite files --frontmatter "status=='draft'"

# High priority docs
mdite files --frontmatter "priority=='high'"

# Docs with 'api' tag
mdite files --frontmatter "contains(tags, 'api')"
```

### Output Formats

```bash
# JSON output with metadata
mdite files --format json

# Annotate with depth
mdite files --with-depth

# Null-separated for xargs -0
mdite files --print0
```

### Sorting

```bash
# Sort by depth (shallowest first)
mdite files --sort depth

# Sort by incoming links (most referenced)
mdite files --sort incoming

# Sort by outgoing links (most connections)
mdite files --sort outgoing
```

### Unix Composition

```bash
# Search with ripgrep
mdite files | xargs rg "API"

# Search in published docs only
mdite files --frontmatter "status=='published'" | xargs rg "TODO"

# Count words in published docs
mdite files --frontmatter "status=='published'" | xargs wc -w

# List files with grep-friendly depth annotation
mdite files --with-depth | grep "^[01]"
```
