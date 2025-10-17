# Config Reference

Complete reference for configuration options.

## Overview

This project uses a layered configuration system. See the [Configuration Guide](../guides/configuration.md) for usage examples.

## Configuration Files

The project searches for configuration in these locations:

1. `example.config.js` (JavaScript)
2. `.examplerc` (JSON or YAML)
3. `.examplerc.json` (JSON)
4. `.examplerc.yaml` (YAML)
5. `package.json` (`example` field)

## Configuration Schema

### entrypoint

**Type:** `string`
**Default:** `'README.md'`

The starting point for analysis.

```javascript
{
  entrypoint: 'docs/README.md'
}
```

### rules

**Type:** `object`
**Default:** See below

Configure rule severity levels.

```javascript
{
  rules: {
    'rule-one': 'error',   // Fail on violations
    'rule-two': 'warn',    // Warning only
    'rule-three': 'off',   // Disabled
  }
}
```

#### Available Rules

- `rule-one` - Description of rule one (default: `'error'`)
- `rule-two` - Description of rule two (default: `'warn'`)
- `rule-three` - Description of rule three (default: `'error'`)

### extends

**Type:** `string | string[]`
**Default:** `undefined`

Extend from shared configurations:

```javascript
{
  extends: ['@example/config-recommended']
}
```

### Custom Rules

Define custom validation rules:

```javascript
{
  customRules: {
    'my-rule': {
      severity: 'error',
      pattern: /custom-pattern/,
    }
  }
}
```

## Configuration Precedence

Configuration is loaded in this order (highest precedence first):

1. CLI options (e.g., `--entrypoint`)
2. Project configuration file
3. User configuration (`~/.config/example/config.json`)
4. Default configuration

## Examples

### Minimal Configuration

```javascript
// example.config.js
module.exports = {
  entrypoint: 'README.md',
};
```

### Full Configuration

```javascript
// example.config.js
module.exports = {
  entrypoint: 'docs/README.md',
  rules: {
    'rule-one': 'error',
    'rule-two': 'warn',
    'rule-three': 'off',
  },
  extends: ['@example/config-recommended'],
};
```

### YAML Configuration

```yaml
# .examplerc.yaml
entrypoint: README.md
rules:
  rule-one: error
  rule-two: warn
  rule-three: off
```

### package.json Configuration

```json
{
  "name": "my-project",
  "example": {
    "entrypoint": "README.md",
    "rules": {
      "rule-one": "error"
    }
  }
}
```

## CLI Override

CLI options override file configuration:

```bash
example-project check --entrypoint docs/README.md
```

See [CLI Reference](./cli.md) for all CLI options.

## Related

- [Configuration Guide](../guides/configuration.md) - Configuration guide
- [CLI Reference](./cli.md) - CLI documentation
- [Getting Started](../getting-started.md) - Quick start guide
- [Main Documentation](../README.md) - Overview
