# Documentation Root

This is the top-level entry point for all documentation.

## Documentation Sections

- [API Documentation](./docs/api/README.md) - API reference and methods
- [User Guides](./docs/guides/README.md) - Setup and tutorials

## Scope Limiting

This example demonstrates mdite's scope limiting feature:

- When you run `mdite lint docs/api/README.md`, only `docs/api/**` is validated
- When you run `mdite lint docs/guides/README.md`, only `docs/guides/**` is validated
- When you run `mdite lint root-README.md`, the entire tree is within scope
- Use `--no-scope-limit` to validate everything from any entry point

See the main README.md for detailed scenarios and use cases.
