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
  },
});
