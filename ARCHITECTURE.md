# Architecture

## Overview

mdite is a comprehensive **documentation toolkit** built as a modular system with clear separation of concerns. The architecture follows a layered approach, separating CLI concerns from core business logic and shared utilities.

**Core Philosophy**: mdite treats documentation as a **connected system** (graph), not isolated files. This graph foundation enables all current and future features: validation, dependency analysis, search, output, and more.

## Core Components

### CLI Layer

**Purpose**: Parse command-line arguments and options, coordinate user interaction

**Location**: `src/cli.ts`, `src/commands/`

**Key files**:
- `cli.ts` - Main CLI setup with Commander.js, signal handlers, global options
- `commands/lint.ts` - Validation command (structural integrity)
- `commands/deps.ts` - Dependency analysis command
- `commands/config.ts` - Configuration management commands
- `commands/init.ts` - Initialize configuration
- **Future**: `commands/query.ts`, `commands/cat.ts`, `commands/toc.ts`

**Responsibilities**:
- Parse CLI arguments and options (including Unix-friendly flags)
- Load and merge configuration
- Initialize logger with appropriate verbosity and output modes
- Handle Unix signals (SIGINT, SIGTERM, SIGPIPE) gracefully
- Execute commands and handle errors with proper exit codes
- Format output for user consumption (respecting stdout/stderr separation)

### Core Layer

**Purpose**: Business logic and orchestration of documentation system operations

**Location**: `src/core/`

**Key files**:
- `doc-linter.ts` - Main orchestrator that coordinates all operations
- `graph-analyzer.ts` - **Graph foundation**: Dependency graph building and traversal (enables all features)
- `link-validator.ts` - Link and anchor validation
- `config-manager.ts` - Multi-layer configuration management
- `remark-engine.ts` - Content linting with remark plugins
- `reporter.ts` - Result formatting and output
- **Future**: Query engine, content output processor, TOC generator

**Responsibilities**:
- Build documentation dependency graph (foundation for all features)
- Validate links (files and anchors)
- Detect orphaned files
- Analyze dependencies and relationships
- Run content linting with remark
- Aggregate and return results
- **Future**: Search/query operations, content output, TOC generation

### Type Layer

**Purpose**: Define data structures and schemas

**Location**: `src/types/`

**Key files**:
- `config.ts` - Configuration schemas and types (Zod-based)
- `graph.ts` - Dependency graph data structure
- `results.ts` - Lint results and error types
- `errors.ts` - Lint error message format
- `exit-codes.ts` - Standard Unix exit codes enum

**Responsibilities**:
- Define type-safe configuration schemas
- Provide runtime validation with Zod
- Structure lint results and errors
- Define standard exit codes for Unix compatibility
- Ensure type safety across the codebase

### Utility Layer

**Purpose**: Shared utilities and helpers

**Location**: `src/utils/`

**Key files**:
- `logger.ts` - Unix-friendly logging with TTY detection, stdout/stderr separation, quiet/verbose modes
- `errors.ts` - Custom error classes with exit codes and context
- `error-handler.ts` - Error handling middleware and utilities
- `fs.ts` - File system utilities (find markdown files, check existence)
- `paths.ts` - Path resolution for config files (user/project)
- `slug.ts` - GitHub-style heading slugification
- `reporter.ts` - Format lint results for text/JSON output with stream separation

**Responsibilities**:
- Provide Unix-friendly logging (TTY detection, color control, quiet/verbose modes)
- Separate data (stdout) from messages (stderr) for pipe compatibility
- Handle errors with proper context and exit codes
- Manage file system operations
- Format output for different consumers

## Data Flow

### Current Operations (lint, deps)

```
1. User runs CLI command
   ↓
2. CLI parses arguments (Commander.js)
   ↓
3. ConfigManager loads and merges config
   (Defaults → User Config → Project Config → CLI Options)
   ↓
4. GraphAnalyzer builds dependency graph from entrypoint
   (Foundation step - used by ALL commands)
   ↓
5. Command-specific operations:

   lint:
   ├─ GraphAnalyzer detects orphaned files
   ├─ LinkValidator validates all links (files + anchors)
   └─ RemarkEngine runs content linting

   deps:
   ├─ Extract dependencies for target file
   └─ Format as tree, list, or JSON
   ↓
6. Results aggregation
   ↓
7. Reporter formats results (text, JSON, tree, list)
   ├─ Data to stdout (pipeable)
   └─ Messages to stderr (suppressible with --quiet)
   ↓
8. CLI sets appropriate exit code:
   ├─ 0 = Success
   ├─ 1 = Validation errors
   ├─ 2 = Usage errors
   └─ 130 = Interrupted
```

### Future Operations (query, cat, toc)

All will leverage the same graph foundation built by GraphAnalyzer, with command-specific processing layers.

## Configuration System

The configuration system uses a layered approach with clear priority:

**Priority (highest to lowest)**:
1. **CLI Options** - Flags passed on command line (`--entrypoint`, `--format`, etc.)
2. **Project Config** - `.mditerc`, `mdite.config.js`, or `package.json#mdite`
3. **User Config** - `~/.config/mdite/config.json` (personal defaults)
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

## Unix CLI Integration Patterns

mdite follows Unix philosophy and conventions for CLI tool design.

### Stdout/Stderr Separation

**Pattern**: Separate data from messages for pipe-friendly operation

```
stdout (file descriptor 1):
  - Validation results (errors, warnings)
  - JSON output
  - Data intended for further processing

stderr (file descriptor 2):
  - Informational messages (progress, summaries)
  - Headers and separators
  - Success/failure notifications
```

**Implementation**:
- `logger.log()` → stdout (always shown)
- `logger.info()`, `logger.success()`, `logger.header()` → stderr (suppressed in --quiet)
- `logger.error()` → stderr (always shown)

**Benefits**:
```bash
# Pipe data without progress messages
mdite lint --format json | jq '.'

# Suppress progress, keep only errors
mdite lint 2>/dev/null

# Grep errors without interference
mdite lint | grep "Dead link"
```

### TTY Detection

**Pattern**: Auto-detect terminal capabilities and adjust output

```typescript
function shouldUseColors(): boolean {
  if ('NO_COLOR' in process.env) return false;
  if ('FORCE_COLOR' in process.env) return true;
  if (process.env.CI === 'true') return false;
  return process.stdout.isTTY ?? false;
}
```

**Environment Variables**:
- `NO_COLOR` - Disable colors (respects [no-color.org](https://no-color.org))
- `FORCE_COLOR` - Force colors even when not a TTY
- `CI=true` - Auto-disable colors in CI environments

**CLI Flags**:
- `--colors` - Override detection, force colors
- `--no-colors` - Override detection, disable colors

### Exit Codes

**Pattern**: Use standard Unix exit codes for different scenarios

```typescript
enum ExitCode {
  SUCCESS = 0,        // No errors
  ERROR = 1,          // Validation/operational errors
  USAGE_ERROR = 2,    // Invalid arguments/options
  INTERRUPTED = 130,  // SIGINT/SIGTERM (128 + 2)
}
```

**Usage**:
```bash
# Success check
mdite lint && echo "Success"

# Failure check
mdite lint || echo "Failed"

# Capture exit code
mdite lint
echo $?  # 0, 1, 2, or 130
```

### Signal Handling

**Pattern**: Handle Unix signals gracefully

```typescript
process.on('SIGINT', () => {
  console.error('\nInterrupted');
  process.exit(ExitCode.INTERRUPTED);
});

process.on('SIGTERM', () => {
  console.error('\nTerminated');
  process.exit(ExitCode.INTERRUPTED);
});

process.on('SIGPIPE', () => {
  process.exit(ExitCode.SUCCESS);
});
```

**Benefits**:
- Clean Ctrl+C handling
- Proper exit codes for signal termination
- SIGPIPE handling for broken pipes (e.g., `mdite lint | head`)

### Quiet Mode

**Pattern**: Suppress informational output for scripting

```typescript
class Logger {
  private quiet: boolean;

  info(message: string): void {
    if (this.quiet) return;  // Suppressed
    console.error(`ℹ ${message}`);
  }

  error(message: string): void {
    // Always shown, never suppressed
    console.error(`✗ ${message}`);
  }
}
```

**Usage**:
```bash
# Scripting - only errors
mdite lint --quiet

# CI/CD - clean output
mdite lint --quiet --format json
```

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

## Examples Directory

**Location:** `examples/`

**Purpose:** Runnable examples and smoke tests

### Structure

```
examples/
├── 01-04: Core Examples (Phase 1)
├── 05-06: Real-World + Config Variations (Phase 2)
└── 07: Edge Cases (Phase 3)
```

### Usage

Examples serve three purposes:

1. **User Documentation** - Show how mdite works
2. **Manual Testing** - Quick smoke tests during development
3. **Regression Testing** - Verify behavior across releases

### Difference from tests/fixtures/

| Aspect | tests/fixtures/ | examples/ |
|--------|----------------|-----------|
| Purpose | Automated unit tests | Manual demos + smoke tests |
| Audience | Developers (internal) | Users + Developers |
| Execution | Via Vitest | Via CLI |
| Documentation | Minimal | Comprehensive |
| Scope | Focused test cases | Realistic scenarios |

### Running Examples

```bash
# Individual example
cd examples/01-valid-docs && mdite lint

# Full smoke test suite
cd examples && ./run-all-examples.sh
```

See [examples/README.md](./examples/README.md) for details.

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
8. **Unix Philosophy**: Pipe-friendly, proper exit codes, stdout/stderr separation
   - Data to stdout, messages to stderr
   - TTY detection for automatic color control
   - Standard exit codes (0/1/2/130)
   - Graceful signal handling (SIGINT, SIGTERM, SIGPIPE)
   - Quiet mode for scripting
   - Respects `NO_COLOR` and `FORCE_COLOR` environment variables

## Code Organization

```
src/
├── cli.ts              # CLI entry point with signal handlers
├── index.ts            # Main executable
├── commands/           # CLI commands
│   ├── lint.ts         # Validation command
│   ├── deps.ts         # Dependency analysis
│   ├── config.ts       # Config management
│   └── init.ts         # Config initialization
├── core/               # Business logic
│   ├── doc-linter.ts   # Main orchestrator
│   ├── graph-analyzer.ts # Graph foundation
│   ├── link-validator.ts # Link validation
│   ├── config-manager.ts # Config loading
│   ├── remark-engine.ts  # Content linting
│   └── reporter.ts       # Result formatting
├── types/              # Type definitions
│   ├── config.ts       # Config schemas (Zod)
│   ├── graph.ts        # Graph structure
│   ├── results.ts      # Lint results
│   ├── errors.ts       # Error types
│   └── exit-codes.ts   # Unix exit codes enum
└── utils/              # Shared utilities
    ├── logger.ts         # Unix-friendly logging
    ├── errors.ts         # Custom error classes
    ├── error-handler.ts  # Error handling
    ├── fs.ts             # File system ops
    ├── paths.ts          # Path resolution
    ├── slug.ts           # Heading slugification
    ├── reporter.ts       # Output formatting
    └── dependency-reporter.ts  # Dependency formatting
```

## Future Enhancements

Potential areas for expansion:

1. **`mdite query`**: Search across documentation system
   - Full-text search across connected docs
   - Pattern matching on file names
   - Metadata/frontmatter queries
2. **`mdite cat`**: Output documentation content
   - Pipe to shell tools
   - Order by dependency graph
   - Filter and concatenate
3. **`mdite toc`**: Generate table of contents from graph
4. **`mdite stats`**: Documentation metrics and analysis
5. **External link validation**: Check HTTP/HTTPS URLs (with caching)
6. **Watch mode**: Monitor files and re-lint on changes
7. **Plugin System**: Allow external plugins for custom rules
8. **Fix Mode**: Automatically fix certain issues
9. **LSP Server**: Language server protocol for editor integration
10. **Custom Reporters**: Allow custom output formatters
11. **Configuration Presets**: Shareable configuration packages

## Resources

- [unified Ecosystem](https://unifiedjs.com/)
- [remark Plugins](https://github.com/remarkjs/remark/blob/main/doc/plugins.md)
- [Commander.js](https://github.com/tj/commander.js)
- [Zod Validation](https://github.com/colinhacks/zod)
