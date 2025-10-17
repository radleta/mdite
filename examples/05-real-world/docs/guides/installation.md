# Installation Guide

Complete guide for installing and setting up MyProject.

## Prerequisites

Before installing MyProject, ensure you have:
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher (or yarn/pnpm)
- **Git** (for contributing)

## Installation Methods

### Method 1: npm (Recommended)

Install from npm registry:

```bash
npm install myproject
```

### Method 2: yarn

Install using yarn:

```bash
yarn add myproject
```

### Method 3: pnpm

Install using pnpm:

```bash
pnpm add myproject
```

### Method 4: From Source

For development or contributing (see [Contributing Guide](../../CONTRIBUTING.md)):

```bash
git clone https://github.com/example/myproject.git
cd myproject
npm install
npm run build
```

## Verification

Verify installation:

```javascript
// test.js
import { myFunction } from 'myproject';
console.log('MyProject installed successfully!');
```

Run with:
```bash
node test.js
```

## Development Setup

For contributing to MyProject:

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Run tests: `npm test`
5. Build: `npm run build`

See [Contributing Guide](../../CONTRIBUTING.md) for detailed development setup.

## Configuration After Installation

After installation, configure MyProject:

```javascript
// myproject.config.js
export default {
  // Your configuration here
};
```

For configuration options, see the [Configuration Guide](./configuration.md).

## Troubleshooting Installation

### Common Issues

**Issue: Module not found**
- Solution: Ensure Node.js version is 18+
- See [Troubleshooting Guide](./troubleshooting.md#module-not-found)

**Issue: Permission errors**
- Solution: Use `sudo` or configure npm prefix
- See [Troubleshooting Guide](./troubleshooting.md#permission-errors)

**Issue: Build failures**
- Solution: Clear cache and reinstall
- See [Troubleshooting Guide](./troubleshooting.md#build-failures)

## Next Steps

After installation:
1. [Configure MyProject](./configuration.md)
2. Follow the [Getting Started Tutorial](../tutorials/getting-started.md)
3. Explore the [API Reference](../api-reference/overview.md)

## Related Documentation

- [Configuration Guide](./configuration.md)
- [Troubleshooting](./troubleshooting.md)
- [Getting Started Tutorial](../tutorials/getting-started.md)
- [Main README](../../README.md)
