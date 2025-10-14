# Architecture

## Overview

doc-lint is a comprehensive documentation linter built as a modular system with clear separation of concerns. The architecture follows a layered approach, separating CLI concerns from core business logic and shared utilities.

## Core Components

### CLI Layer

**Purpose**: Parse command-line arguments and options, coordinate user interaction

**Location**: `src/cli.ts`, `src/commands/`

**Key files**:
- `cli.ts` - Main CLI setup with Commander.js, registers all commands
- `commands/lint.ts` - Lint command implementation (primary command)
- `commands/config.ts` - Configuration management commands

**Responsibilities**:
- Parse CLI arguments and options
- Load and merge configuration
- Initialize logger with appropriate verbosity
- Execute commands and handle errors
- Format output for user consumption

### Core Layer

**Purpose**: Business logic and orchestration of linting operations

**Location**: `src/core/`

**Key files**:
- `doc-linter.ts` - Main orchestrator that coordinates all linting phases
- `graph-analyzer.ts` - Dependency graph building and traversal
- `link-validator.ts` - Link and anchor validation
- `config-manager.ts` - Multi-layer configuration management
- `remark-engine.ts` - Content linting with remark plugins

**Responsibilities**:
- Build documentation dependency graphs
- Validate links (files and anchors)
- Detect orphaned files
- Run content linting with remark
- Aggregate and return results

### Type Layer

**Purpose**: Define data structures and schemas

**Location**: `src/types/`

**Key files**:
- `config.ts` - Configuration schemas and types (Zod-based)
- `graph.ts` - Dependency graph data structure
- `results.ts` - Lint results and error types
- `errors.ts` - Lint error message format

**Responsibilities**:
- Define type-safe configuration schemas
- Provide runtime validation with Zod
- Structure lint results and errors
- Ensure type safety across the codebase

### Utility Layer

**Purpose**: Shared utilities and helpers

**Location**: `src/utils/`

**Key files**:
- `logger.ts` - Colored console logging with verbosity control
- `errors.ts` - Custom error classes with exit codes and context
- `error-handler.ts` - Error handling middleware and utilities
- `fs.ts` - File system utilities (find markdown files, check existence)
- `paths.ts` - Path resolution for config files (user/project)
- `slug.ts` - GitHub-style heading slugification
- `reporter.ts` - Format lint results for text/JSON output

**Responsibilities**:
- Provide consistent logging across the application
- Handle errors with proper context and exit codes
- Manage file system operations
- Format output for different consumers

## Data Flow

```
1. User runs CLI command
   ↓
2. CLI parses arguments (Commander.js)
   ↓
3. ConfigManager loads and merges config
   (Defaults → User Config → Project Config → CLI Options)
   ↓
4. DocLinter orchestrates linting:
   ├─ GraphAnalyzer builds dependency graph from entrypoint
   ├─ GraphAnalyzer detects orphaned files
   ├─ LinkValidator validates all links (files + anchors)
   └─ RemarkEngine runs content linting
   ↓
5. LintResults aggregates all errors/warnings
   ↓
6. Reporter formats results (text or JSON)
   ↓
7. CLI outputs results and sets exit code
```

## Configuration System

The configuration system uses a layered approach with clear priority:

**Priority (highest to lowest)**:
1. **CLI Options** - Flags passed on command line (`--entrypoint`, `--format`, etc.)
2. **Project Config** - `.doclintrc`, `doclint.config.js`, or `package.json#doclint`
3. **User Config** - `~/.config/doc-lint/config.json` (personal defaults)
4. **Defaults** - Built-in defaults from `src/types/config.ts`

Each layer is merged into the next, with higher priority layers overriding lower ones.

## Graph Building Algorithm

The dependency graph is built using depth-first traversal:

```
1. Start with entrypoint file (e.g., README.md)
2. Parse markdown to extract links
3. For each relative .md link:
   - Resolve absolute path
   - Skip if already visited (cycle detection)
   - Add edge to graph
   - Recursively visit target file
4. Return complete graph of reachable files
```

**Orphan Detection**: After graph is built, find all markdown files in directory that are NOT in the graph.

## Link Validation

Link validation handles three types of links:

### 1. Anchor-only links (`#heading`)
- Extract all headings from current file
- Convert to GitHub-style slugs
- Check if anchor matches any heading

### 2. File links (`./other.md`)
- Resolve relative path
- Check if file exists
- Report error if not found

### 3. File + anchor links (`./other.md#section`)
- First validate file exists
- Then extract headings from target file
- Check if anchor matches any heading

## Error Handling

All errors extend `DocLintError` base class with:
- `code` - Machine-readable error code
- `exitCode` - CLI exit code (0 = success, 1+ = failure)
- `context` - Additional metadata for debugging
- `cause` - Original error (for error wrapping)

Error hierarchy:
```
DocLintError (base)
├── ConfigNotFoundError
├── InvalidConfigError
├── FileNotFoundError
├── DirectoryNotFoundError
├── FileReadError
├── FileWriteError
├── ValidationError
├── SchemaValidationError
├── GraphBuildError
├── DeadLinkError
├── DeadAnchorError
├── MarkdownParseError
├── FrontmatterParseError
├── InvalidArgumentError
├── MissingArgumentError
├── OperationCancelledError
└── TimeoutError
```

## Extension Points

### Adding a New Rule

1. Define rule logic in appropriate module (e.g., `link-validator.ts`)
2. Add rule name to `RuntimeConfig.rules` type
3. Update `DEFAULT_CONFIG` with default severity
4. Implement rule checking logic
5. Add tests for the new rule
6. Update documentation

### Adding a New Command

1. Create command file in `src/commands/` (e.g., `commands/check.ts`)
2. Register command in `src/cli.ts`:
   ```typescript
   import { checkCommand } from './commands/check.js';
   program.addCommand(checkCommand());
   ```
3. Add integration tests in `tests/integration/`
4. Update README with command documentation

### Adding a New Output Format

1. Update `RuntimeConfig.format` type in `src/types/config.ts`
2. Implement formatter in `src/utils/reporter.ts`
3. Add tests for new format
4. Update CLI help text

### Adding Configuration Validation

1. Update appropriate schema in `src/types/config.ts`:
   - `UserConfigSchema` for user config
   - `ProjectConfigSchema` for project config
   - `RuntimeConfigSchema` for final runtime config
2. Zod will automatically validate at runtime
3. Add tests for invalid configurations

## Testing Strategy

### Unit Tests (`tests/unit/`)
- Test individual modules in isolation
- Mock dependencies
- Fast execution
- High coverage

### Integration Tests (`tests/integration/`)
- Test full workflows (CLI, commands)
- Use real file system (temp directories)
- Test error scenarios
- Slower but more comprehensive

### Test Infrastructure (`tests/`)
- `setup.ts` - Helper functions for test setup
- `utils.ts` - Test utilities (fixtures, assertions)
- `mocks/` - Mock objects (logger, etc.)
- `fixtures/` - Sample markdown files for testing

## Performance Considerations

### Graph Building
- Uses cycle detection to prevent infinite loops
- Visits each file only once
- Lazy loading (only parses files when needed)

### Link Validation
- Async file operations with `Promise.all()` for parallel validation
- Caches heading extractions per file
- Skips external links (http/https)

### File System Operations
- Uses `fs/promises` for async I/O
- Skips hidden directories and `node_modules`
- Minimal file reads (only what's needed)

## Dependencies

### Core Dependencies
- **unified** - Markdown parsing and processing
- **remark-parse** - Markdown AST parser
- **remark-lint** - Markdown linting rules
- **commander** - CLI argument parsing
- **cosmiconfig** - Configuration file loading
- **zod** - Runtime schema validation
- **chalk** - Terminal colors
- **globby** - File pattern matching

### Development Dependencies
- **TypeScript** - Type safety
- **Vitest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Design Principles

1. **Separation of Concerns**: Clear boundaries between CLI, core logic, and utilities
2. **Type Safety**: Comprehensive TypeScript types with runtime validation
3. **Testability**: All components are independently testable
4. **Extensibility**: Easy to add new rules, commands, and formats
5. **Error Handling**: Rich error context with user-friendly messages
6. **Configuration**: Flexible multi-layer configuration system
7. **Performance**: Async operations with minimal file I/O

## Code Organization

```
src/
├── cli.ts              # CLI entry point
├── index.ts            # Main executable
├── commands/           # CLI commands
│   ├── lint.ts
│   └── config.ts
├── core/               # Business logic
│   ├── doc-linter.ts
│   ├── graph-analyzer.ts
│   ├── link-validator.ts
│   ├── config-manager.ts
│   └── remark-engine.ts
├── types/              # Type definitions
│   ├── config.ts
│   ├── graph.ts
│   ├── results.ts
│   └── errors.ts
└── utils/              # Shared utilities
    ├── logger.ts
    ├── errors.ts
    ├── error-handler.ts
    ├── fs.ts
    ├── paths.ts
    ├── slug.ts
    └── reporter.ts
```

## Future Enhancements

Potential areas for expansion:

1. **Plugin System**: Allow external plugins for custom rules
2. **Watch Mode**: Monitor files and re-lint on changes
3. **Fix Mode**: Automatically fix certain issues
4. **Remote Link Validation**: Check external URLs (with caching)
5. **Frontmatter Validation**: Validate YAML frontmatter against schemas
6. **Custom Reporters**: Allow custom output formatters
7. **IDE Integration**: Language server protocol support
8. **Configuration Presets**: Shareable configuration packages

## Resources

- [unified Ecosystem](https://unifiedjs.com/)
- [remark Plugins](https://github.com/remarkjs/remark/blob/main/doc/plugins.md)
- [Commander.js](https://github.com/tj/commander.js)
- [Zod Validation](https://github.com/colinhacks/zod)
