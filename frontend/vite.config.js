import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 4000,
  },
  css: {
    postcss: './postcss.config.js',
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
});
