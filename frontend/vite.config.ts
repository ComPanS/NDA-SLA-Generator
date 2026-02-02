import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.BACKEND_URL || 'http://localhost:8001';
  const allowedHosts = (env.DEV_ALLOWED_HOSTS || 'humbler-loise-untolled.ngrok-free.dev')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      allowedHosts: allowedHosts.length ? allowedHosts : undefined,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
  };
});
