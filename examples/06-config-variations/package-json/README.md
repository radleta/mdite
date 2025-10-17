# package.json Configuration Example

This example demonstrates embedding mdite configuration in package.json.

## Configuration

The configuration is in the `mdite` field of package.json:

```json
{
  "name": "my-project",
  "mdite": {
    "entrypoint": "README.md",
    "rules": {
      "orphan-files": "error",
      "dead-link": "error",
      "dead-anchor": "error"
    }
  }
}
```

## Why Use package.json?

Use package.json configuration when:
- **Fewer Files** - Reduce config file clutter
- **Single Source** - All config in one place
- **npm Scripts** - Easy to integrate with npm scripts
- **Simple Config** - Configuration is straightforward

## Pros and Cons

### Pros
- ✅ One less file to manage
- ✅ Easy to find configuration
- ✅ Works well with npm scripts
- ✅ Standard Node.js pattern

### Cons
- ❌ No comments allowed (JSON format)
- ❌ Can make package.json large
- ❌ Harder to share config between projects
- ❌ No dynamic values

## When to Use Separate Config File

Use a separate config file when:
- You need comments explaining options
- Configuration is complex
- You want to share config via `extends`
- You prefer JavaScript for dynamic values

See [strict configuration](../strict/README.md) for JavaScript config with comments.

## npm Scripts Integration

Add scripts to package.json:

```json
{
  "scripts": {
    "docs:lint": "mdite lint",
    "docs:lint:json": "mdite lint --format json",
    "docs:check": "mdite lint || true"
  }
}
```

Then run:
```bash
npm run docs:lint
```

## Documentation

This doc set includes:
- This README (entrypoint)
- [Guide](./guide.md) - Connected guide

## Try It

```bash
mdite lint
```

Or using npm script:
```bash
npm run docs:lint
```

## See Also

- [Minimal Configuration](../minimal/README.md) - Minimal `.mditerc`
- [Strict Configuration](../strict/README.md) - JavaScript with comments
- [Warnings Configuration](../warnings/README.md) - YAML format
