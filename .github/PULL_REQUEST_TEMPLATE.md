# Pull Request

## Description

<!-- Provide a clear and concise description of your changes -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement
- [ ] Test improvement
- [ ] Release (version bump and publish)

## Related Issues

<!-- Link to related issues, e.g., "Closes #123" or "Fixes #456" -->

## Changes Made

<!-- List the main changes in bullet points -->

-
-
-

## Testing

<!-- Describe the tests you ran and how to reproduce them -->

- [ ] Tests pass locally (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)

## Checklist

<!-- Mark completed items with an "x" -->

- [ ] My code follows the project's code style
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have added or updated tests for my changes
- [ ] All new and existing tests pass
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings or errors

---

## Release Checklist

<!-- Only complete this section for release PRs -->

**Complete only if this is a release PR (version bump)**

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Type check passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Full validation passes (`npm run validate`)

### Documentation

- [ ] CHANGELOG.md updated with all changes since last release
- [ ] CHANGELOG.md has correct version number and date
- [ ] README.md is up-to-date
- [ ] Breaking changes documented (if any)
- [ ] Migration guide added (if needed for breaking changes)

### Version

- [ ] Version number is appropriate (follows semver)
- [ ] Version in package.json is correct
- [ ] Git tag matches version (will be created by `npm version`)

### Package

- [ ] Package size checked (`npm run size:check`)
- [ ] Package contents verified (`npm run pack:dry`)
- [ ] Package verification passed (`npm run verify:package`)
- [ ] No unwanted files included (test files, configs, etc.)
- [ ] LICENSE file included in package
- [ ] README and CHANGELOG included in package

### Testing

- [ ] Tested locally with `npm link`
- [ ] Installation tested (`npm install -g .`)
- [ ] CLI commands tested and working
- [ ] `doc-lint --version` shows correct version
- [ ] `doc-lint --help` displays correctly
- [ ] Tested on sample documentation project

### Pre-Release Verification

- [ ] All CI checks passing
- [ ] No outstanding critical bugs
- [ ] All planned features for this release are complete
- [ ] Release notes prepared (will be in GitHub release)
- [ ] Contributors acknowledged (if applicable)

### Release Process

- [ ] `NPM_TOKEN` is configured in GitHub Secrets (maintainers only)
- [ ] Ready to run `npm version [patch|minor|major]`
- [ ] Confirmed automatic push of tags is working (postversion hook)

**After merging and tagging:**

- [ ] GitHub Actions release workflow succeeded
- [ ] Package published to npm
- [ ] GitHub release created with correct notes
- [ ] npm package verified: https://www.npmjs.com/package/doc-lint
- [ ] Installation tested: `npm install -g doc-lint@latest`

---

## Additional Notes

<!-- Any additional information that reviewers should know -->
