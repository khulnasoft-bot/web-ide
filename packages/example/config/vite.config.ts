import { join, resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  root: resolve(__dirname, '../src'),
  envDir: resolve(__dirname, '../../../config'),
  // why: Use relative URL's since this gets published to GitLab pages
  base: './',
  build: {
    target: 'es2022',
    // why: The Makefile puts the web-ide self-hosted assets into this directory
    emptyOutDir: false,
    outDir: resolve(__dirname, '../dist'),
    sourcemap: true,
    rollupOptions: {
      input: [
        resolve(__dirname, '../src/index.html'),
        resolve(__dirname, '../src/oauth_callback.html'),
      ],
      output: {
        sourcemapPathTransform: (relativeSourcePath: string) =>
          join('./packages/example/example/src', relativeSourcePath),
      },
    },
  },
});
