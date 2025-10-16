# Warnings Configuration Example

This example demonstrates a flexible doc-lint configuration using warnings instead of errors for some rules.

## Configuration

The `.doclintrc.yaml` file uses YAML format:

```yaml
entrypoint: README.md

rules:
  orphan-files: warn    # Warning only
  dead-link: warn       # Warning only
  dead-anchor: error    # Still fails on error
```

## Why Use Warnings?

Use warnings when:
- **Gradual Adoption** - Introducing doc-lint to existing projects
- **Non-Blocking CI** - Don't want to fail builds on documentation issues
- **Active Editing** - Documentation is being reorganized
- **Flexibility** - Want to see issues without enforcement

## Severity Levels

| Level | Behavior | Exit Code | Use Case |
|-------|----------|-----------|----------|
| `error` | Fails linting | 1 | Must be fixed |
| `warn` | Shows warning | 0 | Should be fixed |
| `off` | Disabled | 0 | Ignore rule |

## Documentation

This doc set includes:
- This README (entrypoint)
- [Guide](./guide.md) - Connected guide

## Try It

```bash
doc-lint lint
```

Even with warnings, this example should pass cleanly.

## Transitioning to Strict

To gradually adopt stricter standards:

1. Start with all rules as `warn`
2. Fix warnings over time
3. Change rules to `error` one by one
4. Eventually use [strict configuration](../strict/README.md)

## YAML vs JSON vs JavaScript

### YAML
```yaml
rules:
  orphan-files: warn
  dead-link: error
```

### JSON
```json
{
  "rules": {
    "orphan-files": "warn",
    "dead-link": "error"
  }
}
```

### JavaScript
```javascript
module.exports = {
  rules: {
    'orphan-files': 'warn',
    'dead-link': 'error',
  },
};
```

Choose the format that best fits your project!

## See Also

- [Minimal Configuration](../minimal/README.md) - Use defaults
- [Strict Configuration](../strict/README.md) - All rules as errors
- [package.json Configuration](../package-json/README.md) - Embedded config
