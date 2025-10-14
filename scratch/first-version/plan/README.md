# doc-lint Implementation Plan

## Overview

This directory contains the detailed implementation plan for the first version of `doc-lint`, a project-level linter for validating the structural integrity and consistency of Markdown documentation repositories.

**Reference Project:** This plan follows the conventions, structure, and patterns established by [`claude-iterate`](/workspace/claude-iterate/), a well-architected CLI tool that serves as our blueprint for best practices.

---

## Plan Documents

### 1. [Architecture](./architecture.md)
Technical architecture and design decisions:
- Core orchestrator model
- Dependency graph system
- Plugin architecture for remark integration
- Module organization and responsibilities

### 2. [File Structure](./file-structure.md)
Complete file and directory layout:
- Source code organization
- Configuration patterns
- Test structure
- Build and distribution setup

### 3. [Implementation Phases](./implementation-phases.md)
Phased approach to building v1:
- Phase 1: Project foundation and CLI skeleton
- Phase 2: Graph traversal and orphan detection
- Phase 3: Link validation
- Phase 4: Remark integration and file-level linting
- Phase 5: Configuration and polish

---

## Key Design Principles

Following `claude-iterate`'s proven patterns:

1. **Clean Architecture**
   - Separation of concerns: commands, core logic, services, utilities
   - Single responsibility per module
   - Clear dependency flow

2. **Type Safety**
   - Strict TypeScript with comprehensive type definitions
   - Zod schemas for runtime validation
   - No implicit any, proper error types

3. **Developer Experience**
   - Intuitive CLI with Commander.js
   - Clear, actionable error messages
   - Helpful guidance and next steps

4. **Quality Standards**
   - Comprehensive test coverage (unit + integration)
   - ESLint + Prettier for consistency
   - Vitest for fast, modern testing

5. **Modern Node.js**
   - ESM modules (not CommonJS)
   - Node.js 18+ target
   - Native ES2022 features

---

## Technology Stack

Based on `claude-iterate`'s proven choices:

### Core Dependencies
- **TypeScript** 5.8+ - Type-safe development
- **Commander.js** 12+ - CLI framework
- **Zod** 3+ - Schema validation
- **Chalk** 5+ - Terminal colors
- **unified/remark** - Markdown parsing and linting
  - `unified` - Core processing pipeline
  - `remark-parse` - Markdown → AST
  - `remark-lint` - Linting framework
  - `remark-frontmatter` - YAML frontmatter support
- **Ajv** - JSON Schema validation for frontmatter

### Development Dependencies
- **Vitest** 2+ - Testing framework
- **@vitest/coverage-v8** - Coverage reports
- **ESLint** 9+ - Linting
- **Prettier** 3+ - Formatting
- **TypeScript-ESLint** - TypeScript linting

---

## Success Criteria for V1

The first version is complete when:

1. **Graph Operations**
   - ✅ Build dependency graph from entrypoint
   - ✅ Detect orphaned markdown files
   - ✅ Validate relative file links
   - ✅ Validate anchor/fragment links

2. **Remark Integration**
   - ✅ Parse files with unified/remark
   - ✅ Apply configurable remark-lint rules
   - ✅ Validate frontmatter against JSON Schema
   - ✅ Report errors with file/line/column

3. **CLI Experience**
   - ✅ Simple invocation: `npx doc-lint`
   - ✅ Configuration file discovery (cosmiconfig)
   - ✅ Clear error reporting
   - ✅ Help and documentation

4. **Quality Metrics**
   - ✅ 80%+ test coverage
   - ✅ All tests passing
   - ✅ Type-safe (no implicit any)
   - ✅ Linted and formatted

---

## Out of Scope for V1

Deferred to future versions:

- ❌ Auto-fix functionality (`--fix` flag)
- ❌ External link checking (HTTP/HTTPS)
- ❌ Caching for performance optimization
- ❌ Custom rule authoring API
- ❌ Watch mode
- ❌ Language server protocol (LSP) support

---

## Development Workflow

Following `claude-iterate`'s npm script conventions:

```bash
# Development
npm run dev          # Watch mode compilation
npm run build        # Production build
npm run clean        # Remove dist/

# Quality
npm run typecheck    # TypeScript validation
npm run lint         # ESLint
npm run format       # Prettier (write)
npm run format:check # Prettier (check)
npm run validate     # All quality checks

# Testing
npm test             # Run all tests
npm run test:unit    # Unit tests only
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report

# Release
npm run pack:dry     # Test package
npm run release      # Prepare for release
```

---

## Next Steps

1. Read [Architecture](./architecture.md) to understand the system design
2. Review [File Structure](./file-structure.md) for the complete file layout
3. Follow [Implementation Phases](./implementation-phases.md) to build incrementally

Each document provides actionable, detailed guidance for implementing that aspect of the system.
