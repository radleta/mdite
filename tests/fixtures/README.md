# Test Fixtures

This directory contains test fixtures used across the test suite.

## Directory Structure

### valid-docs/
Valid documentation structure for testing happy paths. Contains properly linked markdown files with no orphans or broken links.

**Files:**
- `README.md` - Root document with links to other files
- `guide.md` - User guide
- `api.md` - API documentation

**Use Cases:**
- Testing successful linting
- Validating correct graph construction
- Verifying no false positives

### invalid-docs/
Documentation with various errors for testing error detection.

**Files:**
- `README.md` - Root document with broken links
- `orphan.md` - Orphaned file (not linked from anywhere)

**Use Cases:**
- Testing broken link detection
- Testing orphan file detection
- Verifying error reporting

### broken-links/
Documentation with broken internal links for focused link validation testing.

**Files:**
- `README.md` - Contains links to non-existent files
- `existing.md` - Valid file that exists

**Use Cases:**
- Testing dead link detection
- Validating link resolution

### broken-anchors/
Documentation with broken anchor links for focused anchor validation testing.

**Files:**
- `README.md` - Contains links to non-existent anchors
- `other.md` - Target file with valid anchors

**Use Cases:**
- Testing dead anchor detection
- Validating anchor resolution

### with-orphans/
Documentation with orphaned files for focused orphan detection testing.

**Files:**
- `README.md` - Root document
- `guide.md` - Connected file
- `connected.md` - Connected file
- `orphan.md` - Orphaned file (not linked)

**Use Cases:**
- Testing orphan file detection
- Validating graph connectivity

### configs/
Sample configuration files for testing config loading and validation.

**Files:**
- `minimal.config.js` - Minimal configuration
- `strict.config.js` - Strict configuration with all rules as errors
- `custom-rules.config.js` - Custom rule configuration

**Use Cases:**
- Testing config loading
- Validating config merging
- Testing rule configuration

## Adding New Fixtures

When adding new test fixtures:

1. **Keep them minimal** - Only include what's needed for the test
2. **Document clearly** - Add comments explaining the purpose
3. **Update this README** - Document new fixtures and their use cases
4. **Use realistic content** - Make fixtures representative of real documentation
5. **Consider reusability** - Design fixtures to be used by multiple tests

## Best Practices

- Use `getFixturePath()` from `tests/utils.ts` to get fixture paths
- Don't modify fixtures during tests - create temporary copies if needed
- Keep fixture content simple and focused on the test scenario
- Use descriptive file names that indicate the fixture's purpose
