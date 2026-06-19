import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    copyPublicDir: false,
    emptyOutDir: false,
    minify: true,
    outDir: '.vite/build',
    lib: {
      entry: 'src/main.ts',
      fileName: () => 'main.js',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'electron',
        'electron/common',
        'electron/main',
        ...builtinModules,
        ...builtinModules.map((moduleName) => `node:${moduleName}`),
      ],
    },
  },
  clearScreen: false,
  resolve: {
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});
