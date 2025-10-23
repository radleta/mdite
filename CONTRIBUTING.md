# Contributing to mdite

Thanks for your interest in contributing to mdite! This document provides guidelines for contributing to the project.

**mdite** is a markdown documentation toolkit that treats documentation as a connected system. We're building features that enable system-wide operations: validation, dependency analysis, search, and output.

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something great together.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/radleta/mdite.git
cd mdite

# Install dependencies
npm install

# Build the project
npm run build

# Link for local testing
npm link

# Test the CLI
mdite --version

# Run smoke tests against examples
cd examples
./run-all-examples.sh
```

## Git Hooks

This project uses **Husky** and **lint-staged** for automated pre-commit quality checks.

### Setup

Hooks are automatically configured when you run `npm install` (via the `prepare` script).

Husky installs the hooks to `.husky/` directory, and lint-staged runs linting/formatting only on staged files for fast performance.

### Pre-commit Hook

The pre-commit hook (`.husky/pre-commit`):

- Prevents committing `scratch/`, `claude-iterate/`, `coverage/`, or `node_modules/` directories
- Runs `lint-staged` which automatically:
  - Runs ESLint with `--fix` on staged `.ts` files
  - Runs Prettier with `--write` on staged TypeScript, JSON, Markdown, and YAML files
  - Re-stages the fixed files

**What is lint-staged?**
lint-staged only runs linters on files you've staged for commit, making pre-commit checks extremely fast. Configuration is in `package.json` under the `lint-staged` key.

### Conventional Commits

While not enforced by a hook, we follow [Conventional Commits](https://conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

**Valid types:**

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Tests
- `chore:` - Build/tooling
- `perf:` - Performance

### Bypassing Hooks

In exceptional cases, you can bypass hooks:

```bash
git commit --no-verify
```

**Note:** This is not recommended and should only be used when absolutely necessary.

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test files
npm run test:unit
npm run test:integration

# Run smoke tests (examples)
npm run examples
# or
cd examples && ./run-all-examples.sh

# Test specific example
cd examples/01-valid-docs && mdite lint
```

### Test Coverage

- **Unit Tests:** Isolated module testing (`tests/unit/`)
- **Integration Tests:** Full CLI workflows (`tests/integration/`)
- **Smoke Tests:** Manual verification (`examples/`) ⭐ NEW

### Code Quality Checks

```bash
# Lint code
npm run lint

# Type check
npm run typecheck

# Format code
npm run format

# Run all checks (lint + typecheck + test)
npm run validate
```

## Development Workflow

### 1. Fork and Clone

Fork the repository on GitHub, then clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/mdite.git
cd mdite
git remote add upstream https://github.com/radleta/mdite.git
```

### 2. Create a Branch

Create a feature branch from `main`:

```bash
git checkout main
git pull upstream main
git checkout -b feature/my-awesome-feature
```

Use descriptive branch names:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements

### 3. Make Changes

- Write clean, readable code
- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Keep commits focused and atomic

### 4. Test Your Changes

```bash
# Run validation suite
npm run validate

# Run smoke tests
npm run examples

# Test the CLI locally
npm run build
npm link
mdite --version
mdite init
```

### 5. Commit Your Changes

Follow [Conventional Commits](https://conventionalcommits.org/) format:

```
type(scope): brief description

Longer description if needed.

- Bullet points for details
- More information

Closes #123
```

**Types:**

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring (no functional changes)
- `test:` - Test additions or changes
- `chore:` - Build process, tooling, dependencies
- `perf:` - Performance improvements
- `style:` - Code style changes (formatting, etc.)

**Examples:**

```bash
git commit -m "feat: add external link validation"

git commit -m "fix: handle missing frontmatter gracefully

- Check if frontmatter exists before parsing
- Return empty object if missing
- Add tests for edge case

Closes #45"

git commit -m "docs: add examples for custom rules"
```

### 6. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/my-awesome-feature

# Create PR on GitHub
```

**PR Guidelines:**

- Fill out the PR template completely
- Reference related issues
- Ensure all CI checks pass
- Respond to review feedback promptly

**Before submitting:**

1. ✅ All automated tests pass (`npm test`)
2. ✅ Code is linted and formatted (`npm run validate`)
3. ✅ **Smoke tests pass (`npm run examples`)** ⭐ NEW
4. ✅ Documentation is updated
5. ✅ Commit messages follow conventional commits

## Project Structure

```
mdite/
├── src/
│   ├── commands/         # CLI command implementations (lint, deps, init, config)
│   │                     # Future: query, cat, toc
│   ├── core/             # Business logic (graph analysis, validation, etc.)
│   │   ├── doc-linter.ts      # Main orchestrator
│   │   ├── graph-analyzer.ts  # Graph foundation (enables all features)
│   │   ├── link-validator.ts  # Link/anchor validation
│   │   └── ...
│   ├── types/            # Zod schemas and TypeScript types
│   ├── utils/            # Utilities (logger, fs, errors)
│   ├── cli.ts            # CLI setup (Commander.js)
│   └── index.ts          # Entry point
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   ├── fixtures/         # Test fixtures
│   └── setup.ts          # Test configuration
├── examples/             # Runnable examples & smoke tests
└── dist/                 # Compiled output (generated)
```

**Key files:**

- `src/cli.ts` - Register new commands here
- `src/core/graph-analyzer.ts` - Graph foundation for all features
- `src/types/*.ts` - Zod schemas for validation
- `tests/fixtures/` - Sample docs for automated testing
- `examples/` - Runnable examples for manual testing & documentation

## Architecture Patterns

### Adding a New Command

1. Create command file: `src/commands/my-command.ts`
2. Export command function that returns a Commander `Command`
3. Register in `src/cli.ts`
4. Add tests in `tests/unit/` or `tests/integration/`
5. Update README.md with command documentation

**Example:**

```typescript
// src/commands/my-command.ts
import { Command } from 'commander';
import { Logger } from '../utils/logger.js';

export function myCommand(): Command {
  return new Command('my-command')
    .description('Do something awesome')
    .argument('<path>', 'Path argument')
    .option('-f, --force', 'Force flag')
    .action(async (path, options) => {
      const logger = new Logger();
      logger.info(`Running my-command for ${path}`);
      // Implementation...
    });
}
```

```typescript
// src/cli.ts
import { myCommand } from './commands/my-command.js';

// In cli() function:
program.addCommand(myCommand());
```

### Adding a New Rule

1. Define rule logic in appropriate module
2. Add to rule configuration in types
3. Update documentation
4. Add comprehensive tests

### Maintaining CLI Help Text

mdite follows Unix CLI best practices. When adding or modifying commands, follow the **hybrid approach**:

- **Shared sections** (identical across commands) → `src/utils/help-text.ts`
- **Command-specific sections** (unique content) → Colocate with command

**Pattern**: Define help as constants at the top of command files (DESCRIPTION, EXAMPLES, SEE_ALSO), then add via `.addHelpText('after', CONSTANT)`.

**Reference implementations**:

- `src/commands/config.ts` - Simple (~35 lines)
- `src/commands/init.ts` - Medium (~40 lines)
- `src/commands/files.ts` - Complex (~90 lines, Unix composition focus)

**Testing**: Add integration tests to `tests/integration/cli-help.test.ts` checking for presence of each section

### Testing Guidelines

- **All new features need tests**
- Tests should be fast (<10 seconds for full suite)
- Tests should be deterministic (no flaky tests)
- Use test fixtures for complex scenarios
- Mock external dependencies when appropriate
- **Test stdout/stderr separation** for commands that produce output

**Test structure:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('MyFeature', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = doSomething(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

**Testing Unix CLI Features:**

When testing CLI commands, properly test stdout/stderr separation:

```typescript
// Integration test pattern
function runCli(args: string[]): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const { spawnSync } = require('child_process');
  const result = spawnSync('node', ['dist/src/index.js', ...args], {
    cwd: testDir,
    encoding: 'utf-8',
  });

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status || 0,
  };
}

// Test stdout/stderr separation
it('should output data to stdout and messages to stderr', () => {
  const result = runCli(['lint', '--format', 'json']);

  // Data goes to stdout
  expect(result.stdout).toContain('{');
  const json = JSON.parse(result.stdout);

  // Messages go to stderr (or are suppressed in quiet mode)
  expect(result.stderr).toContain('Linting');

  // Exit codes
  expect(result.exitCode).toBe(1); // validation error
});

// Test quiet mode
it('should suppress messages in quiet mode', () => {
  const result = runCli(['lint', '--quiet']);

  // Stderr should not have info messages in quiet mode
  expect(result.stderr).not.toContain('Building dependency graph');

  // But errors still appear
  if (result.exitCode !== 0) {
    expect(result.stdout).toBeTruthy();
  }
});
```

**Unit test pattern for Logger:**

```typescript
import { vi, type MockInstance } from 'vitest';

describe('Logger', () => {
  let consoleLogSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should output data to stdout', () => {
    logger.log('data');
    expect(consoleLogSpy).toHaveBeenCalledWith('data');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should output messages to stderr', () => {
    logger.info('info message');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('info message'));
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
```

## Adding Examples

When adding a new feature, consider adding an example to demonstrate it.

### When to Add an Example

Add an example if:

- Feature is user-facing
- Feature demonstrates a common use case
- Feature is complex and benefits from demonstration
- Feature adds a new configuration option

### Example Structure

1. **Choose directory** in appropriate phase:
   - **Phase 1 (`01-04`):** Core features (orphans, links, anchors)
   - **Phase 2 (`05-06`):** Real-world scenarios, config variations
   - **Phase 3 (`07`):** Edge cases (cycles, deep nesting, etc.)

2. **Create files:**
   - `README.md` - Explain the example clearly
   - Markdown files demonstrating the feature
   - Config file (`.mditerc`, `mdite.config.js`, etc.)

3. **Update `examples/run-all-examples.sh`:**

   ```bash
   run_example \
       "example-name" \
       "path/to/example" \
       false \  # or true if errors expected
       "Brief description"
   ```

4. **Update `examples/README.md`** with the new example

5. **Test:**
   ```bash
   cd examples/your-example && mdite lint
   cd .. && ./run-all-examples.sh
   ```

See [examples/README.md](./examples/README.md) for existing examples and detailed documentation.

## Documentation

- Update README.md for user-facing features
- Add JSDoc comments for public APIs
- Update examples as needed
- Keep documentation in sync with code

## Release Process

> **Note:** This section is for maintainers with publish rights.

### Prerequisites

- Maintainer access to repository
- npm account with publish rights to `mdite` package
- `NPM_TOKEN` configured in GitHub repository secrets

### Release Steps

#### 1. Ensure Clean State

```bash
git checkout main
git pull origin main
npm run validate  # All tests must pass
```

#### 2. Update CHANGELOG

Before versioning, ensure CHANGELOG.md is up-to-date:

- Move items from `[Unreleased]` section to the new version section
- Update version header with release date
- Review that all notable changes are documented

#### 3. Version Bump

Use npm version command to bump the version following [Semantic Versioning](https://semver.org/):

```bash
# For bug fixes (0.1.0 → 0.1.1)
npm version patch

# For new features (0.1.0 → 0.2.0)
npm version minor

# For breaking changes (0.1.0 → 1.0.0)
npm version major
```

This command will:

- Run `npm run validate` to ensure code quality (preversion hook)
- Update version in package.json
- Update CHANGELOG.md with the new version (version hook)
- Create a git commit with the version change
- Create a git tag (e.g., `v0.1.1`)
- Push changes and tags to remote (postversion hook)

#### 4. Automated Publishing

Once the tag is pushed, GitHub Actions automatically:

1. Detects the tag push
2. Runs all tests
3. Builds the project
4. Publishes to npm with provenance attestation
5. Creates a GitHub release with CHANGELOG link

#### 5. Verify Release

After the GitHub Action completes:

```bash
# Check npm package
open https://www.npmjs.com/package/mdite

# Check GitHub release
open https://github.com/radleta/mdite/releases

# Test installation
npm install -g mdite@latest
mdite --version
```

### Versioning Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (0.0.X) - Bug fixes, no API changes, backward compatible
- **Minor** (0.X.0) - New features, backward compatible, no breaking changes
- **Major** (X.0.0) - Breaking changes, not backward compatible

**Examples:**

- Fix a bug → `npm version patch`
- Add a new command option → `npm version minor`
- Remove or change command interface → `npm version major`

### Pre-release Versions

For beta or release candidate versions:

```bash
# Create a beta version (e.g., 1.0.0-beta.1)
npm version premajor --preid=beta

# Or manually set version
npm version 1.0.0-beta.1
```

### Troubleshooting

#### GitHub Actions Workflow Fails

- Check [Actions tab](https://github.com/radleta/mdite/actions) for logs
- Verify `NPM_TOKEN` secret is valid and not expired
- Ensure all tests pass locally: `npm run validate`
- Check that build succeeds: `npm run build`

#### npm Publish Fails

- Verify package name availability on npm
- Check npm account has publish permissions
- Ensure `.npmignore` doesn't exclude `dist/` directory
- Verify provenance is supported (requires npm 9+ and Node 18+)

#### Tag Already Exists

If you need to recreate a tag:

```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag (use with caution!)
git push origin :refs/tags/v1.0.0

# Recreate tag
npm version 1.0.0
```

#### Reverting a Release

If a release has critical issues:

1. Publish a patch version with fix
2. Deprecate the broken version on npm:
   ```bash
   npm deprecate mdite@1.0.0 "Critical bug, use 1.0.1 instead"
   ```

### NPM Token Setup

For maintainers setting up automated releases:

#### 1. Generate npm Access Token

```bash
# Login to npm
npm login

# Generate an automation token
npm token create --type=automation
```

Copy the token value (you won't be able to see it again).

#### 2. Add Token to GitHub Secrets

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: Paste the token from step 1
5. Click **Add secret**

#### 3. Verify Setup

Create a test tag to verify the workflow (on a feature branch):

```bash
git checkout -b test-release
git tag v0.0.1-test
git push origin v0.0.1-test
```

Check the Actions tab to see if the workflow runs. Delete the test tag after verification:

```bash
git tag -d v0.0.1-test
git push origin :refs/tags/v0.0.1-test
```

## Questions?

If something is unclear:

1. Check existing issues and discussions
2. Review the codebase (it's well-documented!)
3. Ask in a new discussion or issue

## License

By contributing to mdite, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

**Thank you for contributing to mdite!** 🚀
