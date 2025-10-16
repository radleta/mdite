# Guide

Guide for package.json configuration approach.

## Configuration Location

When using package.json, the `mdite` field contains all configuration:

```json
{
  "mdite": {
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
- `mdite.config.js` - JavaScript with comments
- `.mditerc.yaml` - YAML with comments
- `.mditerc` - JSON or YAML

## Return

Back to [README](./README.md).
