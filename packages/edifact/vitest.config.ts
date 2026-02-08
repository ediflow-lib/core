import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@domain', replacement: path.resolve(__dirname, '../core/src/domain') },
      { find: '@application', replacement: path.resolve(__dirname, '../core/src/application') },
      { find: '@infrastructure', replacement: path.resolve(__dirname, './src/infrastructure') },
      { find: '@test', replacement: path.resolve(__dirname, './test') },
      { find: '@ediflow/core', replacement: path.resolve(__dirname, '../core/src') },
      { find: /^@edifact\/(.*)$/, replacement: path.resolve(__dirname, './src/$1') },
      { find: '@edifact', replacement: path.resolve(__dirname, './src/index.ts') },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
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
