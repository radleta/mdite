# Guide

Guide for package.json configuration approach.

## Configuration Location

When using package.json, the `doclint` field contains all configuration:

```json
{
  "doclint": {
    "entrypoint": "README.md",
    "rules": { ... }
  }
}
```

## Advantages

- Centralized configuration
- No extra files needed
- Easy to version control
- Standard Node.js pattern

## Limitations

- JSON format only (no comments)
- Can't use JavaScript features
- Less suitable for complex config
- Makes package.json longer

## Alternative Formats

If you need comments or JavaScript features, use:
- `doclint.config.js` - JavaScript with comments
- `.doclintrc.yaml` - YAML with comments
- `.doclintrc` - JSON or YAML

## Return

Back to [README](./README.md).
