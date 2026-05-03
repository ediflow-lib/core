import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['dist/**', 'test/**', '**/*.config.ts'],
    },
  },
  resolve: {
    alias: {
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@ediflow/infrastructure-shared': path.resolve(__dirname, '../infrastructure-shared/src/index.ts'),
      '@ediflow/x12': path.resolve(__dirname, '../x12/src/index.ts'),
    },
  },
});
