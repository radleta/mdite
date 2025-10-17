module.exports = {
  entrypoint: 'README.md',
  include: ['**/*.md'],
  exclude: ['node_modules/**'],
  rules: {
    'orphan-files': 'error',
    'dead-links': 'error',
    'broken-anchors': 'error',
  },
};
