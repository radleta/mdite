# Configuration Guide

Complete guide to configuring MyProject.

## Configuration Files

MyProject supports multiple configuration formats:

- `myproject.config.js` (recommended)
- `myproject.config.json`
- `.myprojectrc`
- `package.json` (`myproject` field)

## Basic Configuration

Create a configuration file:

```javascript
// myproject.config.js
export default {
  option1: 'value1',
  option2: true,
};
```

## Configuration Options

### option1

**Type:** `string`
**Default:** `'default'`

Description of option1.

```javascript
{
  option1: 'custom-value'
}
```

### option2

**Type:** `boolean`
**Default:** `false`

Description of option2.

```javascript
{
  option2: true
}
```

For complete API reference, see [API Overview](../api-reference/overview.md).

## Advanced Configuration

### Nested Configuration

```javascript
export default {
  advanced: {
    feature1: {
      enabled: true,
      options: {
        setting1: 'value',
      },
    },
  },
};
```

See [Advanced Tutorial](../tutorials/advanced.md) for advanced patterns.

### Environment-Specific Configuration

Configure for different environments:

```javascript
const config = {
  development: {
    option1: 'dev-value',
  },
  production: {
    option1: 'prod-value',
  },
};

export default config[process.env.NODE_ENV] || config.development;
```

## Configuration in package.json

Embed configuration in package.json:

```json
{
  "name": "my-app",
  "myproject": {
    "option1": "value1",
    "option2": true
  }
}
```

## Validation

MyProject validates configuration automatically. Invalid configuration will throw errors.

For troubleshooting configuration errors, see [Troubleshooting Guide](./troubleshooting.md#configuration-errors).

## Configuration Precedence

Configuration is loaded in this order (highest priority first):

1. CLI arguments
2. Configuration file
3. package.json
4. Defaults

## CLI Override

Override configuration via CLI:

```bash
myproject --option1 value1 --option2
```

## Examples

### Minimal Configuration

```javascript
export default {
  option1: 'simple',
};
```

### Full Configuration

```javascript
export default {
  option1: 'value1',
  option2: true,
  advanced: {
    feature1: {
      enabled: true,
    },
  },
};
```

## Type Definitions

For TypeScript users, configuration types are available:

```typescript
import { MyProjectConfig } from 'myproject';

const config: MyProjectConfig = {
  option1: 'value',
};
```

See [Types Reference](../api-reference/types.md) for all types.

## Next Steps

- Start using MyProject: [Getting Started Tutorial](../tutorials/getting-started.md)
- Learn advanced features: [Advanced Tutorial](../tutorials/advanced.md)
- Explore the API: [API Reference](../api-reference/overview.md)

## Related

- [Installation Guide](./installation.md)
- [Troubleshooting](./troubleshooting.md)
- [API Methods](../api-reference/methods.md)
