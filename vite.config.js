import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://34.172.91.57:8080',
        changeOrigin: true,
      },
    },
  },
});
