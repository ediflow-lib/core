import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/presentation/cli/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
});
