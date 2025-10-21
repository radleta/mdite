#!/usr/bin/env bash
#
# Smoke test runner for mdite examples
#
# This script runs mdite against all example directories and verifies
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

# Check if mdite is available
check_mdite() {
    if ! command -v mdite &> /dev/null; then
        print_error "mdite command not found"
        print_info "Please install mdite first:"
        echo "  npm install -g mdite"
        echo "  OR"
        echo "  npm link (from the mdite project root)"
        exit 1
    fi

    print_success "mdite is available: $(mdite --version 2>&1 || echo 'version unknown')"
}

# Run a single example test
run_example() {
    local name=$1
    local dir=$2
    local expect_errors=$3
    local description=$4
    shift 4  # Remove first 4 args, leaving any CLI flags
    local cli_args=("$@")

    TOTAL=$((TOTAL + 1))

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_info "Test: $name"
    print_info "Description: $description"
    print_info "Directory: $dir"
    print_info "Expected: $([ "$expect_errors" = "true" ] && echo "Errors detected" || echo "No errors")"
    if [ ${#cli_args[@]} -gt 0 ]; then
        print_info "CLI args: ${cli_args[*]}"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    cd "$EXAMPLES_DIR/$dir" || {
        print_error "Failed to cd to $dir"
        RESULTS+=("✗ $name - Directory not found")
        FAILED=$((FAILED + 1))
        return 1
    }

    # Run mdite and capture output and exit code
    local output
    local exit_code
    output=$(mdite lint "${cli_args[@]}" 2>&1) || exit_code=$?
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

# Run a cat command example
run_cat_example() {
    local name=$1
    local dir=$2
    local description=$3
    shift 3  # Remove first 3 args, leaving any CLI flags
    local cli_args=("$@")

    TOTAL=$((TOTAL + 1))

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_info "Test: $name"
    print_info "Description: $description"
    print_info "Directory: $dir"
    if [ ${#cli_args[@]} -gt 0 ]; then
        print_info "CLI args: mdite cat ${cli_args[*]}"
    else
        print_info "CLI args: mdite cat (default)"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    cd "$EXAMPLES_DIR/$dir" || {
        print_error "Failed to cd to $dir"
        RESULTS+=("✗ $name - Directory not found")
        FAILED=$((FAILED + 1))
        return 1
    }

    # Run mdite cat and capture output and exit code
    local output
    local exit_code
    output=$(mdite cat "${cli_args[@]}" 2>&1) || exit_code=$?
    exit_code=${exit_code:-0}

    # Show first 20 lines of output (for readability)
    echo "$output" | head -20
    if [ $(echo "$output" | wc -l) -gt 20 ]; then
        echo "... (output truncated, showing first 20 lines)"
    fi
    echo ""

    # Cat command should always succeed
    if [ $exit_code -eq 0 ]; then
        # Verify output is not empty
        if [ -n "$output" ]; then
            print_success "Test passed: Command succeeded with output"
            RESULTS+=("✓ $name")
            PASSED=$((PASSED + 1))
            return 0
        else
            print_error "Test failed: Command succeeded but produced no output"
            RESULTS+=("✗ $name - No output")
            FAILED=$((FAILED + 1))
            return 1
        fi
    else
        print_error "Test failed: Command exited with code $exit_code"
        RESULTS+=("✗ $name - Exit code $exit_code")
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Run a files command example
run_files_example() {
    local name=$1
    local dir=$2
    local description=$3
    shift 3  # Remove first 3 args, leaving any CLI flags
    local cli_args=("$@")

    TOTAL=$((TOTAL + 1))

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_info "Test: $name"
    print_info "Description: $description"
    print_info "Directory: $dir"
    if [ ${#cli_args[@]} -gt 0 ]; then
        print_info "CLI args: mdite files ${cli_args[*]}"
    else
        print_info "CLI args: mdite files (default)"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    cd "$EXAMPLES_DIR/$dir" || {
        print_error "Failed to cd to $dir"
        RESULTS+=("✗ $name - Directory not found")
        FAILED=$((FAILED + 1))
        return 1
    }

    # Run mdite files and capture output and exit code
    local output
    local exit_code
    output=$(mdite files "${cli_args[@]}" 2>&1) || exit_code=$?
    exit_code=${exit_code:-0}

    # Show output
    echo "$output"
    echo ""

    # Files command should always succeed
    if [ $exit_code -eq 0 ]; then
        # Verify output is not empty
        if [ -n "$output" ]; then
            print_success "Test passed: Command succeeded with output"
            RESULTS+=("✓ $name")
            PASSED=$((PASSED + 1))
            return 0
        else
            print_error "Test failed: Command succeeded but produced no output"
            RESULTS+=("✗ $name - No output")
            FAILED=$((FAILED + 1))
            return 1
        fi
    else
        print_error "Test failed: Command exited with code $exit_code"
        RESULTS+=("✗ $name - Exit code $exit_code")
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Main execution
main() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "           mdite Examples Smoke Test"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Check prerequisites
    check_mdite
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

    run_example \
        "08-depth-limiting" \
        "08-depth-limiting" \
        false \
        "Depth limiting feature (unlimited depth, no orphans expected)"

    # Phase 4: Advanced Features
    echo ""
    print_info "═══ Phase 4: Advanced Features (File Exclusion) ═══"

    run_example \
        "09-file-exclusion-cli" \
        "09-file-exclusion/cli-exclude" \
        false \
        "CLI exclusion flags (--exclude)" \
        --exclude "drafts/**" --exclude "*.temp.md"

    run_example \
        "09-file-exclusion-config" \
        "09-file-exclusion/config-exclude" \
        false \
        "Config file exclusion (exclude array)"

    run_example \
        "09-file-exclusion-mditeignore" \
        "09-file-exclusion/mditeignore" \
        false \
        ".mditeignore file exclusion"

    run_example \
        "09-file-exclusion-gitignore" \
        "09-file-exclusion/gitignore-respect" \
        false \
        "Respecting .gitignore patterns" \
        --respect-gitignore

    run_example \
        "09-file-exclusion-negation" \
        "09-file-exclusion/negation" \
        false \
        "Negation patterns (!pattern)"

    run_example \
        "09-file-exclusion-combined" \
        "09-file-exclusion/combined" \
        false \
        "Combined exclusion sources with precedence" \
        --exclude "temp/**" --respect-gitignore

    # Phase 5: Content Output (cat command)
    echo ""
    print_info "═══ Phase 5: Content Output (cat command) ═══"

    run_cat_example \
        "10-cat-output-deps" \
        "10-cat-output" \
        "Dependency order output (default)"

    run_cat_example \
        "10-cat-output-alpha" \
        "10-cat-output" \
        "Alphabetical order output" \
        --order alpha

    run_cat_example \
        "10-cat-output-json" \
        "10-cat-output" \
        "JSON format output" \
        --format json

    run_cat_example \
        "10-cat-output-separator" \
        "10-cat-output" \
        "Custom separator output" \
        --separator "\\n---\\n"

    # Phase 6: Scope Limiting
    echo ""
    print_info "═══ Phase 6: Scope Limiting ═══"

    run_example \
        "11-scope-api-default" \
        "11-scope-limiting" \
        false \
        "Scoped validation - API docs (default behavior)" \
        docs/api/README.md

    run_example \
        "11-scope-guides-default" \
        "11-scope-limiting" \
        false \
        "Scoped validation - Guides docs (default behavior)" \
        docs/guides/README.md

    run_example \
        "11-scope-external-warn" \
        "11-scope-limiting" \
        false \
        "External links policy - warn (no errors)" \
        docs/guides/README.md --external-links warn

    run_example \
        "11-scope-external-error" \
        "11-scope-limiting" \
        true \
        "External links policy - error (expect errors)" \
        docs/guides/README.md --external-links error

    run_example \
        "11-scope-unlimited" \
        "11-scope-limiting" \
        false \
        "Unlimited traversal (--no-scope-limit)" \
        docs/guides/README.md --no-scope-limit

    run_example \
        "11-scope-explicit-root" \
        "11-scope-limiting" \
        true \
        "Explicit scope root (finds orphans in broader scope)" \
        docs/api/README.md --scope-root docs

    run_example \
        "11-scope-multi-file" \
        "11-scope-limiting" \
        false \
        "Multi-file mode (common ancestor scope)" \
        docs/api/README.md docs/guides/README.md

    # Phase 7: Files Command
    echo ""
    print_info "═══ Phase 7: Files Command ═══"

    run_files_example \
        "12-files-basic" \
        "12-files-command" \
        "Basic file listing"

    run_files_example \
        "12-files-depth" \
        "12-files-command" \
        "Depth filtering" \
        --depth 1

    run_files_example \
        "12-files-frontmatter-published" \
        "12-files-command" \
        "Frontmatter filtering (published)" \
        --frontmatter "status=='published'"

    run_files_example \
        "12-files-frontmatter-tags" \
        "12-files-command" \
        "Frontmatter filtering (tags)" \
        --frontmatter "contains(tags, 'api')"

    run_files_example \
        "12-files-orphans" \
        "12-files-command" \
        "Orphan detection" \
        --orphans

    run_files_example \
        "12-files-json" \
        "12-files-command" \
        "JSON output format" \
        --format json

    run_files_example \
        "12-files-sort-depth" \
        "12-files-command" \
        "Sort by depth" \
        --sort depth

    run_files_example \
        "12-files-with-depth" \
        "12-files-command" \
        "Annotated with depth" \
        --with-depth

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
