import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'public',
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 12001,
    strictPort: true,
    cors: true,
    hmr: {
      host: 'localhost',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:12000',
        changeOrigin: true,
      },
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      'X-Frame-Options': 'ALLOWALL'
    }
  },
  optimizeDeps: {
    include: ['retell-client-js-sdk'],
  },
  resolve: {
    alias: {
      'retell-client-js-sdk': path.resolve(__dirname, 'node_modules/retell-client-js-sdk'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});