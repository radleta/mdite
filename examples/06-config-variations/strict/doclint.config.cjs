/**
 * Strict doc-lint configuration
 *
 * This configuration explicitly sets all rules to 'error' for
 * strict documentation standards enforcement.
 *
 * Use this in projects where documentation quality is critical
 * and you want to catch all issues immediately.
 */

module.exports = {
  // Documentation entrypoint
  entrypoint: 'README.md',

  // Strict rules: all violations are errors
  rules: {
    // No orphaned files allowed
    // Every documentation file must be reachable
    'orphan-files': 'error',

    // No broken links allowed
    // All file references must exist
    'dead-link': 'error',

    // No broken anchors allowed
    // All heading references must exist
    'dead-anchor': 'error',
  },
};
