import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5174,
    proxy: {
      '/api': apiTarget,
      '/uploads': apiTarget
    }
  },
  build: { outDir: 'dist', sourcemap: false }
});
