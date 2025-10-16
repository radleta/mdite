# mdite - Developer Guide for Claude

## CLAUDE.md Documentation Standards

These standards apply to this file and any other CLAUDE*.md files in the repository.

**Critical: Token-Conscious Documentation**
- Be concise and instructional, not exhaustive
- No duplicate content across sections
- Minimal examples, only when essential
- CLAUDE.md is for instructions, not code dumps
- Remove outdated content immediately

**When adding to CLAUDE.md:**
1. Does this content exist elsewhere?
2. Can this be a 1-line reference?
3. Will this age well or become stale quickly?

## Documentation Organization

@README.md - User documentation
@ARCHITECTURE.md - Detailed architecture
@CONTRIBUTING.md - Contributing guidelines
@CHANGELOG.md - Version history

**This file is for developers working ON mdite, not users of the tool.**

## Project Purpose

**Markdown documentation toolkit** for working with documentation as a connected system. Treats documentation as a graph (files = nodes, links = edges), enabling system-wide operations: validation, dependency analysis, search, and output. Current focus: structural validation and dependency analysis. Future: query, cat (pipe output), toc generation. TypeScript 5.8+, unified/remark, Commander.js, Zod validation, Vitest (251 tests with 80%+ coverage), Node 18+.

## Architecture Quick Reference

**Core modules** (see `src/` for implementation):
- `commands/` - CLI command handlers (lint, init, config, deps; future: query, cat, toc)
- `core/` - Business logic (doc-linter orchestrator, graph-analyzer, link-validator, config-manager, remark-engine, reporter)
- `types/` - Zod schemas (config, graph, results, errors)
- `utils/` - Shared utilities (logger, errors, error-handler, fs, paths, slug)

**Key directories:**
- `src/` - Source code
- `tests/` - Automated tests (unit, integration, fixtures)
- `examples/` - Runnable examples and smoke tests (12 sets, 68 files)
- `scripts/` - Build and release scripts
- `.githooks/` - Pre-commit hooks

**Key files:**
- `src/index.ts` - CLI entry point (shebang for bin)
- `src/cli.ts` - Commander setup, register all commands here
- `src/core/doc-linter.ts` - Main orchestrator coordinating all operations
- `src/core/graph-analyzer.ts` - **Graph foundation**: Dependency graph building via depth-first traversal (enables all features)
- `src/core/link-validator.ts` - Validates file links and anchors
- `src/types/config.ts` - Multi-layer config schema (defaults → user → project → CLI)
- `tests/setup.ts` - Test utilities and fixture helpers

## Critical Concepts

### scratch/ Directory
YOUR working directory for development tasks on mdite itself:
- NOT .gitignored (so you can access it)
- Protected by pre-commit hook (won't be committed)
- Separate from user docs being linted
- For planning, experiments, analysis only

### claude-iterate/ Directory
AI workspace directory:
- NOT .gitignored (AI agents need access)
- Protected by pre-commit hook (won't be committed)
- Contains iteration workspaces and reports
- Never commit this to repo

### Graph Foundation (Core Concept)
**mdite treats documentation as a graph:**
- **Nodes**: Markdown files
- **Edges**: Links between files
- **Root**: Entrypoint file (default: README.md)

This graph model enables ALL current and future features:
- **Current**: Validation (lint), dependency analysis (deps), orphan detection
- **Future**: Search (query), output (cat), TOC generation (toc), metrics (stats)

**Graph traversal**: Depth-first from entrypoint → follows all relative `.md` links → builds reachable set → orphans = all markdown files NOT in graph. Cycle detection prevents infinite loops.

### Multi-Layer Configuration
Config loads in priority order (highest first):
1. CLI options (`--entrypoint`, `--format`)
2. Project config (`.mditerc`, `mdite.config.js`, `package.json#mdite`)
3. User config (`~/.config/mdite/config.json`)
4. Defaults (in `src/types/config.ts`)

See `src/core/config-manager.ts` for implementation.

### Error Hierarchy
All errors extend `DocLintError` with `code`, `exitCode`, `context`, `cause`. 18 custom error classes for specific scenarios. See `src/utils/errors.ts`.

## Development Workflow

**Setup:** `git clone → npm install → npm run build → npm link` (test globally)

**Change cycle:** Edit `src/` → `npm test` → `npm run typecheck` → `npm run lint` → `npm run build` → `npm link` → `cd examples && ./run-all-examples.sh` (smoke test)

**Add command:** Create `src/commands/X.ts` → register in `src/cli.ts` → add tests → update README.md → add to CHANGELOG [Unreleased]

**Modify schema:** Update `src/types/*.ts` Zod schema → update core logic → update tests → verify backwards compatibility

**Add rule:** Define in appropriate module → add to `RuntimeConfig.rules` type → update `DEFAULT_CONFIG` → implement checking → add tests → update docs

## Testing Strategy

**Unit tests** (`tests/unit/`) - 15 files, isolated module testing, fast
**Integration tests** (`tests/integration/`) - Full CLI workflows, real filesystem operations
**Smoke tests** (`examples/`) - 12 example sets for manual verification and regression testing
**Test infrastructure** (`tests/setup.ts`, `tests/utils.ts`, `tests/mocks/`, `tests/fixtures/`)

**Coverage:** 80%+ maintained, run `npm run test:coverage`

## Examples Directory (Smoke Tests)

**Location:** `examples/` (68 files across 12 example sets)

**Purpose:** Manual testing, user documentation, regression verification

**Quick Reference:**
```bash
# Run full smoke test suite (12 tests)
cd examples && ./run-all-examples.sh

# Test individual example
cd examples/01-valid-docs && mdite lint
```

**Structure:**
- **Phase 1 (01-04):** Core features (valid docs, orphans, broken links, broken anchors)
- **Phase 2 (05-06):** Real-world site + config variations (5 examples)
- **Phase 3 (07):** Edge cases (cycles, deep nesting, special chars)

**When to Use:**

Use `examples/` when:
- Testing changes manually before committing
- Verifying bug fixes work end-to-end
- Adding new features (add corresponding example)
- Preparing for releases (run smoke tests)

Use `tests/fixtures/` when:
- Writing automated unit tests
- Testing specific edge cases in isolation
- Running CI/CD pipelines

**Adding New Examples:**
1. Choose phase directory (01-04 core, 05-06 real-world, 07 edge cases)
2. Create files with README.md + config + example docs
3. Update `examples/run-all-examples.sh`
4. Update `examples/README.md`
5. Test: `cd examples/XX && mdite lint`

See `examples/README.md` for full documentation.

## Release Workflow

**Pre-release:** Update CHANGELOG [Unreleased] section → `npm run validate` → `npm run build` → `npm run verify:package` → `npm run size:check` → `cd examples && ./run-all-examples.sh` (smoke test)

**Release:** `npm version [patch|minor|major]` (auto-updates CHANGELOG via `scripts/update-changelog.js`, creates tag) → `git push && git push --tags` (triggers GitHub Actions CI/CD → npm publish with OIDC)

**No auto-push** - Manual push required after version bump

**GitHub Actions:**
- `.github/workflows/ci.yml` - Multi-platform testing (Ubuntu/macOS/Windows, Node 18/20/22)
- `.github/workflows/release.yml` - Automated npm publish on tag push (OIDC trusted publishing)
- `.github/workflows/coverage.yml` - Coverage reports and badging

## Common Issues

- **TypeScript errors in tests**: Check `tests/setup.ts` imports vitest globals correctly
- **Tests fail after schema change**: Update test fixtures in `tests/fixtures/` to match Zod schema
- **npm link broken**: Run `npm run build` first (creates `dist/`)
- **Examples failing**: Run `npm run build && npm link` then retry smoke tests
- **Git hook not working**: Run `git config core.hooksPath .githooks` or `npm run hooks:setup`
- **CLI not executable**: Check shebang in `src/index.ts` and `chmod +x dist/src/index.js` in postbuild
- **Config not loading**: Verify cosmiconfig search paths in `src/core/config-manager.ts`
- **New feature not tested**: Add example to `examples/` and update smoke test script

## Build Scripts

- `scripts/copy-files.js` - Copy package.json, README, CHANGELOG to dist/
- `scripts/validate-build.js` - Verify build output structure
- `scripts/update-changelog.js` - Auto-update CHANGELOG during version bump
- `scripts/verify-package.js` - Verify package.json files array
- `scripts/setup-hooks.sh` - Configure git hooks path

## Git Hooks

- `.githooks/pre-commit` - Blocks scratch/ and claude-iterate/, runs ESLint + Prettier, enforces formatting
- `.githooks/commit-msg` - Validates conventional commit messages

Setup: `git config core.hooksPath .githooks` (auto-run via `npm postinstall`)

## Key Metadata

- **Repo:** github.com/yourusername/mdite (update after publishing)
- **Author:** Your Name (update in package.json)
- **Package:** `mdite` (not yet published to npm)
- **License:** MIT
- **Engines:** Node 18+
- **Package size:** ~25.6 kB (optimized)
- **CI/CD:** Multi-OS testing, automated releases with OIDC

## Related Docs

See @README.md for user guide, @ARCHITECTURE.md for detailed design, @CONTRIBUTING.md for contribution guidelines, CHANGELOG.md for history.

---

**Remember:** This is developer context for building mdite. For usage docs, see README.md.
