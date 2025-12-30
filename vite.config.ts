
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
    host: "0.0.0.0", // Allows access from other devices on the same Wi-Fi
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[VITE PROXY ERROR]: Ensure your backend (node server.js) is running on port 5000.', err);
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
