import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    copyPublicDir: false,
    emptyOutDir: false,
    minify: true,
    outDir: '.vite/build',
    rollupOptions: {
      external: [
        'electron',
        'electron/common',
        'electron/renderer',
        ...builtinModules,
        ...builtinModules.map((moduleName) => `node:${moduleName}`),
      ],
      input: 'src/preload.ts',
      output: {
        format: 'cjs',
        inlineDynamicImports: true,
        entryFileNames: 'preload.js',
        chunkFileNames: 'preload.js',
        assetFileNames: 'preload.[ext]',
      },
    },
  },
  clearScreen: false,
});
