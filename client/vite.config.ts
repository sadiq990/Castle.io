import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'shared': resolve(__dirname, '../shared'),
    },
  },
  // Serve the root assets/ folder at /assets/* so AssetLoader.ts can fetch them.
  publicDir: resolve(__dirname, '../assets'),
  server: {
    host: true,
    port: 5173,
    fs: {
      allow: ['..'],
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
});
