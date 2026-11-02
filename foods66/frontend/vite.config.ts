import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: process.env.BACKEND_URL || env.BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
        '/uploads': {
          target: process.env.BACKEND_URL || env.BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // ── Vitest ──────────────────────────────────────────────
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      tsconfig: './tsconfig.test.json',
      css: false,
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-state': ['zustand'],
            'vendor-ui': ['lucide-react', 'framer-motion'],
            'vendor-charts': ['recharts'],
            'vendor-virtual': ['react-window', 'react-virtualized-auto-sizer'],
            'vendor-ai': ['@google/genai'],
          },
        },
      },
    },
    optimizeDeps: {
      entries: ['index.html'],
      include: ['react', 'react-dom', 'framer-motion', 'recharts'],
    },
  };
});
