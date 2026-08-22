import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx', 'src/element.ts', 'src/sprite.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react/jsx-runtime'],
});
