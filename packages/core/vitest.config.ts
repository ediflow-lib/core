import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: [
      // Exact matches for bare imports (without subpaths)
      { find: /^@domain$/, replacement: path.resolve(__dirname, './src/domain/index.ts') },
      { find: /^@application$/, replacement: path.resolve(__dirname, './src/application/index.ts') },
      { find: /^@infrastructure$/, replacement: path.resolve(__dirname, './src/infrastructure/index.ts') },
      { find: /^@presentation$/, replacement: path.resolve(__dirname, './src/presentation/index.ts') },

      // Subpath imports
      { find: /^@domain\/(.+)$/, replacement: path.resolve(__dirname, './src/domain/$1') },
      { find: /^@application\/(.+)$/, replacement: path.resolve(__dirname, './src/application/$1') },
      { find: /^@infrastructure\/(.+)$/, replacement: path.resolve(__dirname, './src/infrastructure/$1') },
      { find: /^@presentation\/(.+)$/, replacement: path.resolve(__dirname, './src/presentation/$1') },
      { find: /^@test\/(.+)$/, replacement: path.resolve(__dirname, './test/$1') },

      // Fallback for @test without subpath
      { find: '@test', replacement: path.resolve(__dirname, './test') },
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
