# Depth Limiting Example

This example demonstrates mdite's depth limiting feature for progressive validation.

## Quick Start

[Getting Started Guide](docs/getting-started.md)

## Structure

```
README.md (depth 0)
└── docs/
    └── getting-started.md (depth 1)
        └── level2/
            └── setup.md (depth 2)
                └── level3/
                    └── advanced.md (depth 3)
```

## Testing Different Depths

### Depth 0 (Entrypoint Only)

```bash
mdite lint --depth 0
```

**Result**: Only validates README.md, no links followed  
**Orphans**: getting-started.md, setup.md, advanced.md

### Depth 1 (Direct Links)

```bash
mdite lint --depth 1
```

**Result**: Validates README.md and getting-started.md  
**Orphans**: setup.md, advanced.md

### Depth 2

```bash
mdite lint --depth 2
```

**Result**: Validates up to setup.md  
**Orphans**: advanced.md

### Depth 3

```bash
mdite lint --depth 3
```

**Result**: Validates up to advanced.md  
**Orphans**: None

### Unlimited (Default)

```bash
mdite lint
```

**Result**: Validates all files in the chain  
**Orphans**: None

## Orphan Detection with Depth

Files beyond the depth limit are treated as orphans:

- At depth 0: 3 orphans (getting-started.md, setup.md, advanced.md)
- At depth 1: 2 orphans (setup.md, advanced.md)
- At depth 2: 1 orphan (advanced.md)
- At depth 3+: No orphans (all files reachable)

## Use Cases

1. **Progressive Validation**: Validate core docs first, expand gradually

   ```bash
   mdite lint --depth 1  # Core docs
   mdite lint --depth 2  # Core + secondary
   mdite lint            # Full validation
   ```

2. **Performance**: Limit scope on large documentation sets

   ```bash
   mdite lint --depth 2  # Faster validation
   ```

3. **Focused Validation**: Check only immediate dependencies
   ```bash
   mdite lint --depth 1  # Direct links only
   ```

## Try It

Run these commands from this directory:

```bash
# See depth in action
mdite lint --depth 0 --verbose
mdite lint --depth 1 --verbose
mdite lint --depth 2 --verbose
mdite lint --depth 3 --verbose
mdite lint --verbose  # unlimited
```
