#!/usr/bin/env bash
#
# Smoke test runner for doc-lint examples
#
# This script runs doc-lint against all example directories and verifies
# expected behavior (both passing and failing cases).
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXAMPLES_DIR="$SCRIPT_DIR"

# Track results
RESULTS=()
TOTAL=0
PASSED=0
FAILED=0

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if doc-lint is available
check_doclint() {
    if ! command -v doc-lint &> /dev/null; then
        print_error "doc-lint command not found"
        print_info "Please install doc-lint first:"
        echo "  npm install -g doc-lint"
        echo "  OR"
        echo "  npm link (from the doc-lint project root)"
        exit 1
    fi

    print_success "doc-lint is available: $(doc-lint --version 2>&1 || echo 'version unknown')"
}

# Run a single example test
run_example() {
    local name=$1
    local dir=$2
    local expect_errors=$3
    local description=$4

    TOTAL=$((TOTAL + 1))

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_info "Test: $name"
    print_info "Description: $description"
    print_info "Directory: $dir"
    print_info "Expected: $([ "$expect_errors" = "true" ] && echo "Errors detected" || echo "No errors")"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    cd "$EXAMPLES_DIR/$dir" || {
        print_error "Failed to cd to $dir"
        RESULTS+=("✗ $name - Directory not found")
        FAILED=$((FAILED + 1))
        return 1
    }

    # Run doc-lint and capture output and exit code
    local output
    local exit_code
    output=$(doc-lint lint 2>&1) || exit_code=$?
    exit_code=${exit_code:-0}

    echo "$output"
    echo ""

    if [ "$expect_errors" = "true" ]; then
        # Expect non-zero exit (errors should be found)
        if [ $exit_code -ne 0 ]; then
            print_success "Test passed: Errors detected as expected"
            RESULTS+=("✓ $name")
            PASSED=$((PASSED + 1))
            return 0
        else
            print_error "Test failed: Expected errors but none were found"
            RESULTS+=("✗ $name - Expected errors not found")
            FAILED=$((FAILED + 1))
            return 1
        fi
    else
        # Expect zero exit (no errors should be found)
        if [ $exit_code -eq 0 ]; then
            print_success "Test passed: No errors detected"
            RESULTS+=("✓ $name")
            PASSED=$((PASSED + 1))
            return 0
        else
            print_error "Test failed: Unexpected errors were found"
            RESULTS+=("✗ $name - Unexpected errors")
            FAILED=$((FAILED + 1))
            return 1
        fi
    fi
}

# Main execution
main() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "           doc-lint Examples Smoke Test"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Check prerequisites
    check_doclint
    echo ""

    # Run tests
    # Phase 1: Core Examples
    echo ""
    print_info "═══ Phase 1: Core Examples ═══"

    # Happy paths (expect 0 errors)
    run_example \
        "01-valid-docs" \
        "01-valid-docs" \
        false \
        "Well-structured documentation with no errors"

    # Error detection (expect errors)
    run_example \
        "02-orphan-files" \
        "02-orphan-files" \
        true \
        "Documentation with orphaned file"

    run_example \
        "03-broken-links" \
        "03-broken-links" \
        true \
        "Documentation with broken file links"

    run_example \
        "04-broken-anchors" \
        "04-broken-anchors" \
        true \
        "Documentation with broken anchor links"

    # Phase 2: Real-World + Config Variations
    echo ""
    print_info "═══ Phase 2: Real-World + Config Variations ═══"

    run_example \
        "05-real-world" \
        "05-real-world" \
        false \
        "Realistic multi-page documentation site"

    run_example \
        "06-config-minimal" \
        "06-config-variations/minimal" \
        false \
        "Minimal configuration (defaults)"

    run_example \
        "06-config-strict" \
        "06-config-variations/strict" \
        false \
        "Strict configuration (JavaScript with comments)"

    run_example \
        "06-config-warnings" \
        "06-config-variations/warnings" \
        false \
        "Warnings configuration (YAML format)"

    run_example \
        "06-config-package-json" \
        "06-config-variations/package-json" \
        false \
        "Configuration in package.json"

    # Phase 3: Edge Cases
    echo ""
    print_info "═══ Phase 3: Edge Cases ═══"

    run_example \
        "07-edge-cycles" \
        "07-edge-cases/cycles" \
        false \
        "Circular references (cycle detection)"

    run_example \
        "07-edge-deep-nesting" \
        "07-edge-cases/deep-nesting" \
        false \
        "Deep directory nesting (6 levels)"

    run_example \
        "07-edge-special-chars" \
        "07-edge-cases/special-chars" \
        false \
        "Special characters in filenames"

    # Print summary
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "                    Summary"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    for result in "${RESULTS[@]}"; do
        if [[ $result == ✓* ]]; then
            print_success "$result"
        else
            print_error "$result"
        fi
    done

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ $FAILED -eq 0 ]; then
        print_success "All tests passed! ($PASSED/$TOTAL)"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        exit 0
    else
        print_error "Some tests failed. ($PASSED/$TOTAL passed, $FAILED/$TOTAL failed)"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        exit 1
    fi
}

# Run main function
main "$@"
