# Implementation Phases

This document breaks down the development of `doc-lint` v1 into manageable phases, each with clear deliverables and acceptance criteria.

---

## Phase 0: Project Bootstrap

**Goal:** Set up the project structure and development environment

**Duration:** 1-2 hours

### Tasks

1. **Initialize npm project**
   ```bash
   mkdir doc-lint
   cd doc-lint
   npm init -y
   ```

2. **Install dependencies**
   ```bash
   # Core dependencies
   npm install chalk commander cosmiconfig zod
   npm install unified remark-parse remark-frontmatter remark-gfm
   npm install remark-lint unist-util-visit vfile

   # Dev dependencies
   npm install -D typescript @types/node
   npm install -D vitest @vitest/coverage-v8
   npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
   npm install -D prettier
   ```

3. **Create configuration files**
   - `tsconfig.json` (from file-structure.md)
   - `vitest.config.ts`
   - `.prettierrc`
   - `eslint.config.js`
   - `.gitignore`
   - `.npmignore`

4. **Set up project structure**
   ```bash
   mkdir -p src/{commands,core,types,utils}
   mkdir -p tests/{unit,integration,fixtures}
   ```

5. **Add npm scripts to package.json**
   - build, dev, test, lint, format, etc.

6. **Create initial README.md**
   - Project description
   - Installation instructions
   - Basic usage example

### Acceptance Criteria

- ✅ `npm install` succeeds
- ✅ `npm run typecheck` succeeds (even with empty files)
- ✅ `npm run lint` succeeds
- ✅ `npm test` runs (even if no tests yet)
- ✅ Git repository initialized

### Deliverables

- Working build pipeline
- Linting and formatting configured
- Testing framework ready
- Project structure in place

---

## Phase 1: CLI Foundation

**Goal:** Create the CLI interface and basic command structure

**Duration:** 2-3 hours

### Tasks

1. **Create entry point and CLI setup**
   - `src/index.ts` - Entry point with error boundary
   - `src/cli.ts` - Commander.js setup

2. **Implement basic logger**
   - `src/utils/logger.ts` - Logger class with colors

3. **Create stub commands**
   - `src/commands/lint.ts` - Main lint command (stub)
   - `src/commands/init.ts` - Config initialization command
   - `src/commands/config.ts` - Config display command

4. **Add version from package.json**
   - Import version in cli.ts

5. **Make executable**
   - Add shebang to index.ts
   - Update package.json bin field
   - Test with `npm link` or `./dist/src/index.js`

6. **Write tests**
   - `tests/unit/logger.test.ts`
   - `tests/integration/cli.test.ts` (basic invocation)

### Acceptance Criteria

- ✅ `doc-lint --version` shows version
- ✅ `doc-lint --help` shows help text
- ✅ `doc-lint lint --help` shows lint command help
- ✅ `doc-lint init` creates a config file
- ✅ `doc-lint config` displays current config (stub)
- ✅ Logger outputs colored text
- ✅ Tests pass

### Deliverables

- Working CLI with help and version
- Command structure in place
- Logger utility
- init command functional

---

## Phase 2: Configuration System

**Goal:** Implement configuration loading and validation

**Duration:** 2-3 hours

### Tasks

1. **Define configuration types**
   - `src/types/config.ts` - Config interface and Zod schema
   - Define DEFAULT_CONFIG

2. **Implement ConfigManager**
   - `src/core/config-manager.ts`
   - Cosmiconfig integration
   - Config merging (defaults → file → CLI)
   - Zod validation

3. **Create custom error classes**
   - `src/utils/errors.ts`
   - ConfigNotFoundError, InvalidConfigError, etc.

4. **Update init command**
   - Generate comprehensive default config
   - Add options for customization

5. **Update config command**
   - Load and display merged configuration

6. **Write tests**
   - `tests/unit/config-manager.test.ts`
   - Test file discovery, merging, validation
   - Test with various config formats (.js, .json, .yaml)

### Acceptance Criteria

- ✅ ConfigManager loads config from file
- ✅ Config merges correctly (defaults → file → CLI)
- ✅ Zod validation catches invalid configs
- ✅ Supports multiple config formats
- ✅ `doc-lint init` creates working config
- ✅ `doc-lint config` shows merged config
- ✅ Tests pass with 80%+ coverage

### Deliverables

- Functional configuration system
- Config file generation
- Config validation
- Comprehensive tests

---

## Phase 3: Graph Analysis

**Goal:** Build dependency graph and detect orphaned files

**Duration:** 3-4 hours

### Tasks

1. **Create graph data structure**
   - `src/types/graph.ts`
   - DocGraph class with nodes and edges
   - Methods: addFile, addEdge, hasFile, getAllFiles

2. **Implement GraphAnalyzer**
   - `src/core/graph-analyzer.ts`
   - buildGraph() - Recursive traversal from entrypoint
   - visitFile() - Process a single file and follow links
   - extractMarkdownLinks() - Parse markdown and extract links
   - findOrphans() - Compare graph to filesystem

3. **Create filesystem utilities**
   - `src/utils/fs.ts`
   - findMarkdownFiles() - Recursive directory scan
   - fileExists() - Check file existence

4. **Create test fixtures**
   - `tests/fixtures/valid-docs/` - Connected documentation
   - `tests/fixtures/orphans/` - Docs with orphaned files

5. **Write tests**
   - `tests/unit/graph-analyzer.test.ts`
   - Test graph building
   - Test cycle handling
   - Test orphan detection
   - `tests/unit/fs.test.ts`

### Acceptance Criteria

- ✅ Builds graph from entrypoint
- ✅ Follows relative .md links
- ✅ Handles cycles (doesn't infinite loop)
- ✅ Detects orphaned files correctly
- ✅ Ignores external links
- ✅ Tests pass with fixtures

### Deliverables

- Working graph analysis
- Orphan detection
- Filesystem utilities
- Comprehensive tests

---

## Phase 4: Link Validation

**Goal:** Validate file links and anchor links

**Duration:** 3-4 hours

### Tasks

1. **Define error types**
   - `src/types/errors.ts`
   - LintError interface
   - Rule severity types

2. **Implement LinkValidator**
   - `src/core/link-validator.ts`
   - validate() - Main entry point
   - validateFile() - Check all links in a file
   - validateFileLink() - Check file existence
   - validateAnchor() - Check anchor existence
   - extractHeadings() - Get headings from file

3. **Create slug utility**
   - `src/utils/slug.ts`
   - slugify() - Convert heading text to slug

4. **Create test fixtures**
   - `tests/fixtures/broken-links/` - Docs with broken links
   - `tests/fixtures/broken-anchors/` - Docs with broken anchors

5. **Write tests**
   - `tests/unit/link-validator.test.ts`
   - Test file link validation
   - Test anchor link validation
   - Test anchor-only links (#heading)
   - Test cross-file anchor links (file.md#heading)
   - `tests/unit/slug.test.ts`

### Acceptance Criteria

- ✅ Detects broken file links
- ✅ Detects broken anchor links
- ✅ Handles same-file anchors (#heading)
- ✅ Handles cross-file anchors (file.md#heading)
- ✅ Slug generation matches GitHub's algorithm
- ✅ Reports errors with file/line/column
- ✅ Tests pass with fixtures

### Deliverables

- Working link validation
- Anchor validation
- Slug utility
- Comprehensive tests

---

## Phase 5: Remark Integration

**Goal:** Integrate remark-lint for file-level linting

**Duration:** 2-3 hours

### Tasks

1. **Implement RemarkEngine**
   - `src/core/remark-engine.ts`
   - createProcessor() - Build unified pipeline
   - processFile() - Process a single file
   - Convert VFile messages to LintError format

2. **Configure remark plugins**
   - remarkParse - Parse markdown
   - remarkFrontmatter - Parse YAML frontmatter
   - remarkGfm - GitHub Flavored Markdown
   - remarkLint - Linting framework

3. **Add basic lint rules**
   - Start with a few built-in remark-lint rules
   - Make rules configurable via config file

4. **Create test fixtures**
   - `tests/fixtures/lint-errors/` - Files with style issues

5. **Write tests**
   - `tests/unit/remark-engine.test.ts`
   - Test processor creation
   - Test error reporting
   - Test with various markdown features

### Acceptance Criteria

- ✅ Parses markdown files correctly
- ✅ Runs configured lint rules
- ✅ Reports errors with file/line/column
- ✅ Handles frontmatter
- ✅ Handles GFM features (tables, strikethrough, etc.)
- ✅ Tests pass

### Deliverables

- Working remark integration
- Configurable lint rules
- Error reporting
- Tests

---

## Phase 6: Orchestration and Results

**Goal:** Tie everything together in the DocLinter orchestrator

**Duration:** 2-3 hours

### Tasks

1. **Define results types**
   - `src/types/results.ts`
   - LintResults class
   - Methods: hasErrors(), getAllErrors()

2. **Implement DocLinter orchestrator**
   - `src/core/doc-linter.ts`
   - lint() - Main entry point
   - Coordinate: graph → orphans → links → remark
   - Aggregate results

3. **Implement Reporter**
   - `src/core/reporter.ts`
   - reportText() - Human-readable output
   - reportJson() - Machine-readable output
   - Group errors by file
   - Show summary statistics

4. **Complete lint command**
   - `src/commands/lint.ts`
   - Wire up DocLinter
   - Handle options (format, fix stub)
   - Exit with correct code

5. **Write tests**
   - `tests/unit/doc-linter.test.ts`
   - `tests/unit/reporter.test.ts`
   - `tests/integration/full-lint.test.ts` - End-to-end

### Acceptance Criteria

- ✅ Runs all linting steps in sequence
- ✅ Aggregates results correctly
- ✅ Text output is readable and helpful
- ✅ JSON output is valid and complete
- ✅ Exits with code 1 on errors, 0 on success
- ✅ Integration tests pass

### Deliverables

- Complete orchestration
- Result aggregation
- Output formatting
- End-to-end functionality

---

## Phase 7: Polish and Documentation

**Goal:** Finalize v1 for release

**Duration:** 2-3 hours

### Tasks

1. **Improve error messages**
   - Review all error messages
   - Make them actionable and helpful
   - Add suggestions where possible

2. **Add progress indicators**
   - Show progress during graph building
   - Show progress during file processing
   - Add verbose mode for debugging

3. **Write comprehensive README**
   - Installation instructions
   - Quick start guide
   - Configuration reference
   - Examples
   - Troubleshooting

4. **Add CONTRIBUTING.md**
   - Development setup
   - Running tests
   - Code style guide
   - PR process

5. **Create CHANGELOG.md**
   - Document v0.1.0 features

6. **Add examples**
   - Create example documentation projects
   - Add to tests/fixtures or examples/

7. **Final testing**
   - Run against real documentation projects
   - Test installation from npm (npm pack, install from tarball)
   - Verify all commands work
   - Check error handling

8. **Performance review**
   - Profile on large documentation sites
   - Ensure reasonable performance (target: <5s for 100 files)

### Acceptance Criteria

- ✅ README is comprehensive and clear
- ✅ All documentation is complete
- ✅ Error messages are helpful
- ✅ Tests pass with 80%+ coverage
- ✅ `npm run validate` succeeds
- ✅ Works on real documentation projects
- ✅ Installation from npm works
- ✅ Performance is acceptable

### Deliverables

- Complete documentation
- Polished user experience
- Ready for npm publication
- v0.1.0 release candidate

---

## Testing Strategy by Phase

### Unit Tests

Write unit tests during each phase for:
- Individual functions and methods
- Edge cases and error conditions
- Mock external dependencies (filesystem, etc.)

**Target:** 80%+ coverage

### Integration Tests

Write integration tests in phases 6-7 for:
- End-to-end CLI workflows
- Real documentation fixtures
- Config file discovery and merging

**Target:** All major workflows covered

### Test Fixtures

Build up fixtures incrementally:
- Phase 3: valid-docs, orphans
- Phase 4: broken-links, broken-anchors
- Phase 5: lint-errors
- Phase 7: real-world examples

---

## Development Workflow

For each phase:

1. **Plan** - Review tasks and acceptance criteria
2. **Implement** - Write code following the architecture
3. **Test** - Write tests alongside code
4. **Validate** - Run `npm run validate` before moving on
5. **Commit** - Commit with descriptive message

### Quality Gates

Before moving to the next phase:

```bash
npm run validate  # Must pass
npm run test:coverage  # Must be >80%
```

---

## Risk Mitigation

### Potential Issues

1. **Remark complexity** - Remark has a learning curve
   - **Mitigation:** Start with simple use cases, read docs carefully

2. **Performance** - Graph traversal could be slow on large projects
   - **Mitigation:** Test on real projects early, optimize if needed

3. **Edge cases** - Markdown has many edge cases
   - **Mitigation:** Use comprehensive test fixtures

4. **Config validation** - Users might have unusual configs
   - **Mitigation:** Good error messages, examples in docs

---

## Post-V1 Roadmap

After v1 is complete, consider these enhancements:

### v1.1: Auto-fix
- Implement `--fix` flag
- Fix simple issues (formatting, etc.)
- Safe, non-destructive fixes

### v1.2: External Links
- Optional HTTP/HTTPS link checking
- Configurable timeout
- Rate limiting to avoid getting blocked

### v1.3: Performance
- Caching layer (based on file mtimes)
- Parallel file processing
- Incremental mode for CI

### v1.4: Custom Rules
- Plugin API for custom rules
- User-defined rule packages
- Rule presets

### v2.0: Advanced Features
- Watch mode
- LSP server for editor integration
- HTML report generation
- SARIF output for GitHub

---

## Success Metrics

V1 is complete when:

1. **Functionality**
   - ✅ All core features implemented
   - ✅ Graph traversal works
   - ✅ Orphan detection works
   - ✅ Link validation works
   - ✅ Remark integration works

2. **Quality**
   - ✅ 80%+ test coverage
   - ✅ All tests passing
   - ✅ TypeScript strict mode
   - ✅ No linting errors
   - ✅ Formatted with Prettier

3. **Documentation**
   - ✅ Comprehensive README
   - ✅ Contributing guide
   - ✅ Changelog
   - ✅ Code comments

4. **Usability**
   - ✅ Clear error messages
   - ✅ Helpful CLI output
   - ✅ Works on real projects
   - ✅ npm package ready

5. **Performance**
   - ✅ <5s for 100 files
   - ✅ <30s for 1000 files
   - ✅ Reasonable memory usage

---

## Estimated Timeline

**Total: 16-22 hours**

- Phase 0: 1-2 hours (Bootstrap)
- Phase 1: 2-3 hours (CLI)
- Phase 2: 2-3 hours (Config)
- Phase 3: 3-4 hours (Graph)
- Phase 4: 3-4 hours (Links)
- Phase 5: 2-3 hours (Remark)
- Phase 6: 2-3 hours (Orchestration)
- Phase 7: 2-3 hours (Polish)

**Realistic estimate:** 2-3 days of focused development

---

## Getting Started

To begin implementation:

1. Start with Phase 0 (Bootstrap)
2. Follow tasks in order
3. Run tests frequently
4. Commit after each phase
5. Review acceptance criteria before moving on

Good luck!
