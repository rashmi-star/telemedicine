import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      'pdfjs-dist': 'pdfjs-dist/build/pdf',
    },
  },
});
