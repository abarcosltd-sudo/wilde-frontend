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
    rollupOptions: {
      output: {
        /**
         * Splits dependencies that rarely change away from app code, so a
         * deploy that touches a component doesn't invalidate the ~1.1MB of
         * framework the browser already has cached. It does not reduce what the
         * first visit downloads — the route splitting does that.
         *
         * Ionic and Firebase are both still on the boot path and together are
         * most of it. Firestore is pulled in eagerly because `useAuth` runs at
         * startup and imports `firestore.helpers`; deferring it means reworking
         * how auth reads the user document, which is a larger change than a
         * bundler config.
         */
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          ionic: ['@ionic/react', '@ionic/react-router'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
