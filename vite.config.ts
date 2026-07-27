/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  test: {
    // Without this, `describe`/`it` are undefined and every unit file throws.
    globals: true,
    // `tests/e2e` holds Playwright specs, which crash when collected by Vitest.
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    /**
     * Deliberately no `manualChunks`.
     *
     * Grouping vendors by hand (react/react-dom/react-router-dom in one chunk,
     * @ionic/react + @ionic/react-router in another) produced two chunks that
     * imported from each other: `@ionic/react-router` depends on
     * react-router-dom, while React itself was pulled into the Ionic chunk.
     * Circular ES module chunks have no valid evaluation order, so a `const`
     * was read inside its temporal dead zone and the production bundle threw
     * "Cannot access 'b' before initialization" before rendering anything.
     * Dev was unaffected, because Vite serves unbundled modules there.
     *
     * Rollup's automatic chunking derives the graph from real imports and
     * cannot produce that cycle. Hand-grouping only bought cache stability
     * across deploys; the actual payload win comes from the lazy routes in
     * `AppRouter`, which this does not affect.
     */
  },
});
