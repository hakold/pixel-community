import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const devHost = env.VITE_DEV_HOST || 'localhost';
  const rawProxyTarget = env.VITE_API_PROXY_TARGET || env.VITE_SERVER_URL || 'http://localhost:3000';
  const proxyTarget = rawProxyTarget.replace('://localhost', '://127.0.0.1');
  const wsProxyTarget = proxyTarget.replace(/^http/, 'ws');

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      host: devHost,
      port: 5173,
      strictPort: true,
      // 代理后端 API 请求
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          xfwd: true,
        },
        '/ws': {
          target: wsProxyTarget,
          ws: true,
          xfwd: true,
        },
      },
    },
    // Electron 构建时使用相对路径
    base: './',
  };
});
