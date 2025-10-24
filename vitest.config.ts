import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000, // 30s for integration tests that spawn processes
    // Pool configuration to prevent worker timeout errors with integration tests
    // Using forks with singleFork to avoid worker communication timeouts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Run tests in single fork to prevent worker timeouts
      },
    },
    // Increase timeouts for proper cleanup
    teardownTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      exclude: [
        'dist/**',
        'tests/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/**',
        'scripts/**',
        '*.config.ts',
        '*.config.js',
        'examples/**',
        'scratch/**',
        // CLI layer - tested via integration tests
        'src/cli.ts',
        'src/index.ts',
        'src/commands/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
