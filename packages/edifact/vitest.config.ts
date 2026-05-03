import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: [
      // Exact matches for bare imports from core
      { find: /^@domain$/, replacement: path.resolve(__dirname, '../core/src/domain/index.ts') },
      { find: /^@application$/, replacement: path.resolve(__dirname, '../core/src/application/index.ts') },
      { find: /^@infrastructure$/, replacement: path.resolve(__dirname, './src/infrastructure/index.ts') },
      { find: /^@ediflow\/core$/, replacement: path.resolve(__dirname, '../core/src/index.ts') },
      { find: /^@edifact$/, replacement: path.resolve(__dirname, './src/index.ts') },

      // Subpath imports from core
      { find: /^@domain\/(.+)$/, replacement: path.resolve(__dirname, '../core/src/domain/$1') },
      { find: /^@application\/(.+)$/, replacement: path.resolve(__dirname, '../core/src/application/$1') },

      // Subpath imports from edifact
      { find: /^@infrastructure\/(.+)$/, replacement: path.resolve(__dirname, './src/infrastructure/$1') },
      { find: /^@edifact\/(.+)$/, replacement: path.resolve(__dirname, './src/$1') },

      // Test helpers
      { find: '@test', replacement: path.resolve(__dirname, './test') },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['packages/edifact/src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/index.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
