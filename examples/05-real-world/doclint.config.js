/**
 * doc-lint configuration for MyProject
 *
 * This configuration demonstrates a real-world setup with:
 * - Custom entrypoint (README.md is standard)
 * - All rules enabled as errors for strict checking
 * - Comments explaining each option
 */

module.exports = {
  // Start documentation traversal from README.md
  // This is the entry point to your documentation graph
  entrypoint: 'README.md',

  // Rule configuration
  // Each rule can be set to 'error', 'warn', or 'off'
  rules: {
    // Detect files not reachable from entrypoint
    // Helps identify forgotten or outdated documentation
    'orphan-files': 'error',

    // Detect broken relative file links
    // Ensures all internal links point to existing files
    'dead-link': 'error',

    // Detect broken anchor/heading links
    // Validates that #heading references exist
    'dead-anchor': 'error',
  },

  // Future: Frontmatter validation schema
  // frontmatterSchema: { ... },

  // Future: Extend from shared configurations
  // extends: ['@myproject/doclint-config'],
};
