import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {
      API_KEY: process.env.API_KEY
    }
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        // 127.0.0.1 avoids potential IPv6/localhost resolution issues
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[CRITICAL PROXY ERROR] Ensure backend is running: node backend/server.js', err);
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
});