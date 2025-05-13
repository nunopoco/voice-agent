export default {
  root: 'public',
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 12000,
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
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
};