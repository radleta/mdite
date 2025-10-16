# Configuration Variations Examples

This directory demonstrates different configuration formats and styles for doc-lint.

## Overview

doc-lint supports multiple configuration formats and severity levels. These examples show how to configure doc-lint for different use cases.

## Examples

### minimal/

Minimal configuration with only the essentials.

**Config format:** `.doclintrc` (JSON)
**Use case:** Quick setup with defaults

```bash
cd minimal && doc-lint lint
```

### strict/

Strict configuration with all rules as errors.

**Config format:** `doclint.config.js` (JavaScript with comments)
**Use case:** Enforce strict documentation standards

```bash
cd strict && doc-lint lint
```

### warnings/

Flexible configuration with some rules as warnings instead of errors.

**Config format:** `.doclintrc.yaml` (YAML)
**Use case:** Gradual adoption or non-blocking CI checks

```bash
cd warnings && doc-lint lint
```

### package-json/

Configuration embedded in package.json.

**Config format:** `package.json` (`doclint` field)
**Use case:** Keep all config in one file

```bash
cd package-json && doc-lint lint
```

## Configuration Formats Supported

doc-lint searches for configuration in this order:

1. `doclint.config.js` / `doclint.config.cjs` (JavaScript/CommonJS module)
2. `.doclintrc` (JSON or YAML)
3. `.doclintrc.json` (JSON)
4. `.doclintrc.yaml` / `.doclintrc.yml` (YAML)
5. `package.json` (`doclint` field)

**Note:** Use `.cjs` extension for CommonJS modules in ESM projects, or `.js` in CommonJS projects.

## Severity Levels

Each rule can be configured with:
- `'error'` - Fail linting (exit code 1)
- `'warn'` - Show warning but don't fail
- `'off'` - Disable the rule

## Available Rules

| Rule | Description | Default |
|------|-------------|---------|
| `orphan-files` | Detects unreachable files | `error` |
| `dead-link` | Detects broken file links | `error` |
| `dead-anchor` | Detects broken anchor links | `error` |

## Choosing a Configuration Style

### Use JavaScript (`doclint.config.js`) when:
- You want comments in your config
- You need computed/dynamic values
- You prefer code over data

### Use JSON (`.doclintrc` or `.doclintrc.json`) when:
- You want simple, straightforward config
- You prefer standard JSON format
- You don't need comments

### Use YAML (`.doclintrc.yaml`) when:
- You prefer YAML syntax
- You want comments
- Your project uses YAML for other config

### Use package.json when:
- You want all config in one place
- You have a small configuration
- You want to minimize files

## Examples Overview

Each subdirectory contains:
- A configuration file demonstrating the format
- A small documentation set (2-3 files)
- README explaining the configuration

Try them out to see which style works best for your project!
