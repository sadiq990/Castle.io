import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'shared': resolve(__dirname, '../shared'),
    },
  },
  // Serve the root assets/ folder at /assets/* so AssetLoader.ts can fetch them.
  // This folder is shared with the server and contains PNGs/SVGs for entities.
  publicDir: resolve(__dirname, '../assets'),
  server: {
    host: true, // expose on LAN
    port: 5173,
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
});
