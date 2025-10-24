# Strict Configuration Example

This example demonstrates a strict mdite configuration with all rules explicitly set to `error`.

## Configuration

The `mdite.config.cjs` file uses CommonJS format with comments:

```javascript
module.exports = {
  entrypoint: 'README.md',
  rules: {
    'orphan-files': 'error',
    'dead-link': 'error',
    'dead-anchor': 'error',
  },
};
```

## Why Strict Configuration?

Use strict configuration when:
- Documentation quality is critical
- You want to catch all issues immediately
- You're building public documentation
- You want consistent standards across team

## Documentation

This doc set includes:
- This README (entrypoint)
- [Guide](./guide.md) - Connected documentation
- [Reference](./reference.md) - API reference

All files are properly linked with no violations.

## Try It

```bash
mdite lint
```

Should pass with zero errors under strict rules.

## Comparison

| Config Style | orphan-files | dead-link | dead-anchor |
|--------------|--------------|-----------|-------------|
| Minimal | error (default) | error (default) | error (default) |
| **Strict** | **error (explicit)** | **error (explicit)** | **error (explicit)** |
| Warnings | warn | warn | error |

## See Also

- [Minimal Configuration](../minimal/README.md) - Use defaults
- [Warnings Configuration](../warnings/README.md) - Non-blocking checks
- [package.json Configuration](../package-json/README.md) - Embedded config
