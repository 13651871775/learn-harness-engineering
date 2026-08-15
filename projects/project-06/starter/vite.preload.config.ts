import { defineConfig } from 'vite';
import path from 'path';

// Standalone preload config — self-contained CJS bundle for sandboxed preload.
// electron is external (provided at runtime by Electron); everything else
// (including shared/types) is inlined so the preload is a single file.
export default defineConfig({
  build: {
    outDir: 'dist/preload',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/preload/preload.ts'),
      formats: ['cjs'],
      fileName: () => 'preload.js',
    },
    rollupOptions: {
      external: ['electron'],
    },
    // Keep readable for debugging — the bundle is tiny.
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
});