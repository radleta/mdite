# Contributing to MyProject

Thank you for your interest in contributing to MyProject!

## Getting Started

Before you begin:
1. Read the [README](./README.md) to understand the project
2. Follow the [Installation Guide](./docs/guides/installation.md) to set up your environment
3. Review the [API Reference](./docs/api-reference/overview.md) to understand the codebase

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git

### Setup Steps

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Build: `npm run build`

See the [Installation Guide](./docs/guides/installation.md#development-setup) for detailed instructions.

## Making Changes

### Code Changes

1. Create a feature branch
2. Make your changes
3. Write tests
4. Ensure all tests pass
5. Update documentation

### Documentation Changes

When updating documentation:
- Follow the existing structure in [docs/intro.md](./docs/intro.md)
- Update the [API Reference](./docs/api-reference/overview.md) if adding new APIs
- Add examples to [tutorials](./docs/tutorials/getting-started.md) if helpful

## Testing

Run the full test suite:

```bash
npm test
```

For troubleshooting test failures, see the [Troubleshooting Guide](./docs/guides/troubleshooting.md).

## Documentation

### Building Documentation

To build and preview documentation locally:

```bash
npm run docs:build
npm run docs:serve
```

### Documentation Structure

Our documentation follows this structure:
- **[Introduction](./docs/intro.md)** - Overview and concepts
- **[Tutorials](./docs/tutorials/getting-started.md)** - Learning-oriented guides
- **[Guides](./docs/guides/installation.md)** - Task-oriented instructions
- **[API Reference](./docs/api-reference/overview.md)** - Information-oriented reference

## Submitting Changes

1. Push your changes to your fork
2. Create a pull request
3. Describe your changes clearly
4. Link any related issues

## Code of Conduct

Be respectful and constructive. We're all here to build something great together.

## Questions?

If you need help:
- Check the [Troubleshooting Guide](./docs/guides/troubleshooting.md)
- Review the [Advanced Tutorial](./docs/tutorials/advanced.md)
- Open an issue for discussion

## Related Documentation

- [Main README](./README.md)
- [Configuration Guide](./docs/guides/configuration.md)
- [API Overview](./docs/api-reference/overview.md)
