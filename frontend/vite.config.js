import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    // Ensure public files (like _redirects) are copied to dist
    copyPublicDir: true,
  },
  // For development server - handle SPA routing
  server: {
    historyApiFallback: true,
  },
  preview: {
    // For preview server - handle SPA routing
    historyApiFallback: true,
  }
});
