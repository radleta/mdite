# Installation Guide

This guide covers how to install the example project.

## Prerequisites

Before installing, ensure you have:
- Node.js 18+ installed
- npm 9+ or yarn 1.22+
- Terminal/command-line access

See [Getting Started](../getting-started.md) for more information.

## Installation Steps

### Option 1: Global Installation

Install globally to use from anywhere:

```bash
npm install -g example-project
```

### Option 2: Local Installation

Install as a project dependency:

```bash
npm install --save-dev example-project
```

### Option 3: From Source

Clone and build from source:

```bash
git clone https://github.com/example/project.git
cd project
npm install
npm run build
npm link
```

## Verify Installation

Check that installation was successful:

```bash
example-project --version
```

You should see the version number printed.

## Next Steps

- Configure the project: [Configuration Guide](./configuration.md)
- Learn the CLI: [CLI Reference](../api/cli.md)
- Return to [Getting Started](../getting-started.md)

## Troubleshooting

### Command not found

If you see "command not found" after global installation:
1. Check your PATH includes npm global bin directory
2. Try reinstalling with `npm install -g example-project`

### Permission errors

On Unix systems, you may need to use `sudo`:

```bash
sudo npm install -g example-project
```

Or configure npm to use a local prefix. See [Configuration Guide](./configuration.md#npm-configuration) for details.

## Uninstallation

To remove the project:

```bash
npm uninstall -g example-project
```

Return to [main documentation](../README.md).
