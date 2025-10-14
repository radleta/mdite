module.exports = {
  entrypoint: 'docs/index.md',
  include: ['docs/**/*.md'],
  exclude: ['node_modules/**', '**/draft/**'],
  rules: {
    'orphan-files': 'warn',
    'dead-links': 'error',
    'broken-anchors': 'warn',
  },
};
