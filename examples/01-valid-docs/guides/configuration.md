# Configuration Guide

Learn how to configure the example project for your needs.

## Overview

The project supports multiple configuration formats and layers. See [Config Reference](../api/config.md) for complete details.

## Basic Configuration

Create a configuration file in your project root:

```javascript
// example.config.js
module.exports = {
  entrypoint: 'README.md',
  rules: {
    'rule-one': 'error',
    'rule-two': 'warn',
  },
};
```

## Configuration Files

The project searches for configuration in these files (in order):

1. `example.config.js`
2. `.examplerc`
3. `.examplerc.json`
4. `.examplerc.yaml`
5. `package.json` (`example` field)

See the [Config Reference](../api/config.md#configuration-files) for format details.

## Configuration Options

### entrypoint

The starting point for analysis:

```javascript
{
  entrypoint: 'docs/README.md'
}
```

### rules

Configure rule severity:

```javascript
{
  rules: {
    'rule-one': 'error',  // Fail on violations
    'rule-two': 'warn',   // Warning only
    'rule-three': 'off',  // Disabled
  }
}
```

See [Config Reference](../api/config.md#rules) for all available rules.

## CLI Configuration

Override configuration via CLI flags:

```bash
example-project --entrypoint docs/README.md
```

See [CLI Reference](../api/cli.md#options) for all CLI options.

## npm Configuration

For npm-related configuration issues during installation, see [Installation Guide](./installation.md#troubleshooting).

## Advanced Configuration

### Custom Rules

You can define custom rules. See [Config Reference](../api/config.md#custom-rules) for details.

### Extending Configurations

Extend from shared configurations:

```javascript
{
  extends: ['@example/config-recommended'],
  rules: {
    'rule-one': 'warn',  // Override
  }
}
```

## Examples

See the [main documentation](../README.md) for configuration examples.

## Next Steps

- Learn about [CLI commands](../api/cli.md)
- Read the full [Config Reference](../api/config.md)
- Return to [Getting Started](../getting-started.md)
