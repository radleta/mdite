#!/bin/sh
#
# Setup git hooks
#

echo "Setting up git hooks..."

# Configure git to use .githooks directory
git config core.hooksPath .githooks

echo "✓ Git hooks configured successfully"
echo ""
echo "Hooks installed:"
echo "  - pre-commit: Runs lint checks and prevents scratch/ commits"
echo "  - commit-msg: Validates conventional commit format"
echo ""
echo "To bypass hooks (not recommended):"
echo "  git commit --no-verify"
