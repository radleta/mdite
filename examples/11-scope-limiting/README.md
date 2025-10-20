# Example 11: Scope Limiting

This example demonstrates mdite's scope limiting feature, which restricts validation to a specific directory tree by default.

## Feature Overview

**Directory-scoped validation** (new in v1.0.0):

- When you run `mdite lint docs/api/README.md`, it only validates files within `docs/api/**` by default
- Links pointing outside the scope are validated (file exists) but not traversed
- This prevents validation from "escaping" into unrelated documentation sections

## Directory Structure

```
examples/11-scope-limiting/
├── docs/
│   ├── api/
│   │   ├── README.md       # API documentation entry point
│   │   ├── endpoints.md    # Links to methods.md (within scope)
│   │   └── methods.md      # API methods
│   └── guides/
│       ├── README.md       # Guides entry point
│       ├── setup.md        # Setup instructions
│       └── tutorial.md     # Links to ../api/README.md (external link)
└── root-README.md          # Top-level entry point
```

## Scenarios

### Scenario 1: Default Scoped Validation

**Command:**

```bash
mdite lint docs/api/README.md
```

**Expected behavior:**

- ✅ Validates only files within `docs/api/` directory
- ✅ Follows links within scope (README.md → endpoints.md → methods.md)
- ✅ Does NOT traverse into `docs/guides/` even if linked
- ✅ Orphan detection limited to `docs/api/` directory only

**Why:** Scope is automatically determined from entrypoint path (`docs/api/`)

### Scenario 2: External Link Policy - Validate (Default)

**Command:**

```bash
mdite lint docs/guides/README.md
```

**Expected behavior:**

- ✅ Validates files in `docs/guides/` directory
- ✅ Link from `tutorial.md` to `../api/README.md` is validated (file exists)
- ✅ But does NOT traverse into `docs/api/` directory
- ✅ No warnings or errors (external links validated silently)

**Why:** Default `externalLinks: 'validate'` policy

### Scenario 3: External Link Policy - Warn

**Command:**

```bash
mdite lint docs/guides/README.md --external-links warn
```

**Expected behavior:**

- ✅ Validates files in `docs/guides/` directory
- ⚠️ Warning emitted for link to `../api/README.md` (external)
- ✅ Exit code 0 (warnings don't fail)

**Why:** `--external-links warn` policy reports external links as warnings

### Scenario 4: External Link Policy - Error

**Command:**

```bash
mdite lint docs/guides/README.md --external-links error
```

**Expected behavior:**

- ✅ Validates files in `docs/guides/` directory
- ❌ Error emitted for link to `../api/README.md` (external)
- ❌ Exit code 1 (errors fail validation)

**Why:** `--external-links error` policy treats external links as errors

### Scenario 5: Unlimited Traversal (Opt-Out)

**Command:**

```bash
mdite lint docs/guides/README.md --no-scope-limit
```

**Expected behavior:**

- ✅ Validates files in `docs/guides/` directory
- ✅ Follows link to `../api/README.md` and traverses into API docs
- ✅ Validates all reachable files across entire directory tree
- ✅ Orphan detection across entire `docs/` directory

**Why:** `--no-scope-limit` disables scope limiting (classic mdite behavior)

### Scenario 6: Explicit Scope Root

**Command:**

```bash
mdite lint docs/api/README.md --scope-root docs
```

**Expected behavior:**

- ✅ Validates files starting from `docs/api/README.md`
- ✅ Scope boundary set to `docs/` (not `docs/api/`)
- ✅ Can traverse into `docs/guides/` if linked
- ✅ Orphan detection limited to `docs/` directory

**Why:** `--scope-root docs` sets explicit boundary

### Scenario 7: Multi-File Mode (Common Ancestor)

**Command:**

```bash
mdite lint docs/api/README.md docs/guides/README.md
```

**Expected behavior:**

- ✅ Validates both API and guides documentation
- ✅ Automatically determines common ancestor scope: `docs/`
- ✅ Both sections treated as within scope
- ✅ Can follow links between them
- ✅ Orphan detection across `docs/` directory

**Why:** Multi-file mode finds common ancestor (`docs/`) automatically

## Configuration

You can also set these options in config files:

**`.mditerc.json`:**

```json
{
  "scopeLimit": true,
  "scopeRoot": "docs",
  "externalLinks": "warn"
}
```

**`mdite.config.js`:**

```javascript
module.exports = {
  scopeLimit: true, // Enable scope limiting (default: true)
  scopeRoot: 'docs', // Explicit scope boundary (optional)
  externalLinks: 'warn', // Policy: validate|warn|error|ignore (default: validate)
};
```

## Use Cases

### Use Case 1: Monorepo with Multiple Doc Sections

```bash
# Only validate API docs
mdite lint docs/api/README.md

# Only validate guides
mdite lint docs/guides/README.md

# Validate everything
mdite lint root-README.md --no-scope-limit
```

### Use Case 2: Pre-Commit Hook (Changed Files Only)

```bash
# Lint only changed markdown files (limited scope)
mdite lint $(git diff --cached --name-only | grep '\.md$') --depth 1
```

### Use Case 3: Strict Boundary Enforcement

```bash
# Treat external links as errors (prevent cross-section linking)
mdite lint docs/api/README.md --external-links error
```

## Key Benefits

1. **Performance**: Only validates relevant files (faster for large repos)
2. **Isolation**: Validate doc sections independently
3. **Flexibility**: Easy to opt-out with `--no-scope-limit`
4. **Multi-repo support**: Works great in monorepos with multiple doc sets
5. **Pre-commit friendly**: Validate only changed files efficiently

## Testing

Run all scenarios:

```bash
# Scenario 1: Default scoped validation
mdite lint docs/api/README.md

# Scenario 2: External links (validate)
mdite lint docs/guides/README.md

# Scenario 3: External links (warn)
mdite lint docs/guides/README.md --external-links warn

# Scenario 4: External links (error)
mdite lint docs/guides/README.md --external-links error

# Scenario 5: Unlimited traversal
mdite lint docs/guides/README.md --no-scope-limit

# Scenario 6: Explicit scope root
mdite lint docs/api/README.md --scope-root docs

# Scenario 7: Multi-file mode
mdite lint docs/api/README.md docs/guides/README.md
```
