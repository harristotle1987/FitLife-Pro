import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Securely inject the API key into the frontend build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
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
              console.error('[VITE PROXY ERROR]: Ensure your backend (node api/index.js) is running on port 5000.', err);
            });
          },
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
  };
});