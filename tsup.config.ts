import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
  target: 'node18',
  outDir: 'dist',
  // Add shebang for CLI executable
  banner: {
    js: '#!/usr/bin/env node',
  },
});
