# CLI Reference

Complete reference for the command-line interface.

## Installation

See the [Installation Guide](../guides/installation.md) to install the CLI.

## Commands

### check

Run validation checks:

```bash
example-project check [path]
```

**Arguments:**
- `path` - Directory to check (default: current directory)

**Options:**
- `--format <type>` - Output format (`text` or `json`)
- `--config <path>` - Configuration file path
- `--verbose` - Verbose output

**Examples:**

```bash
# Check current directory
example-project check

# Check specific directory
example-project check ./docs

# Output as JSON
example-project check --format json
```

### init

Initialize a configuration file:

```bash
example-project init
```

**Options:**
- `--config <path>` - Configuration file path (default: `example.config.js`)

**Examples:**

```bash
# Create default config
example-project init

# Create with custom name
example-project init --config .examplerc
```

### config

Display current configuration:

```bash
example-project config
```

Shows the merged configuration from all sources.

## Options

### Global Options

These options work with all commands:

- `--help` - Show help
- `--version` - Show version
- `--no-colors` - Disable colored output

### Command-Specific Options

See individual command sections above.

## Configuration

CLI options override configuration file settings. See [Configuration Guide](../guides/configuration.md) for details.

## Exit Codes

- `0` - Success (no errors)
- `1` - Validation errors found
- `2` - Invalid arguments or configuration

## Examples

See the [Getting Started](../getting-started.md) guide for workflow examples.

## Related

- [Config Reference](./config.md) - Configuration file reference
- [Configuration Guide](../guides/configuration.md) - Configuration guide
- [Main Documentation](../README.md) - Overview

## Need Help?

Run any command with `--help`:

```bash
example-project check --help
```
