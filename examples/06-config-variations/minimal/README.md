# Minimal Configuration Example

This example demonstrates a minimal doc-lint configuration.

## Configuration

The `.doclintrc` file contains only the entrypoint:

```json
{
  "entrypoint": "README.md"
}
```

All rules use their default values:
- `orphan-files`: `error`
- `dead-link`: `error`
- `dead-anchor`: `error`

## Documentation

This minimal doc set has:
- This README (entrypoint)
- [Guide](./guide.md) - A connected guide

## When to Use Minimal Config

Use minimal configuration when:
- You're happy with the defaults
- You want quick setup
- You're just getting started with doc-lint

## Try It

```bash
doc-lint lint
```

Should pass with no errors.

## See Also

- [Strict Configuration](../strict/README.md) - All rules explicit
- [Warnings Configuration](../warnings/README.md) - Non-blocking checks
