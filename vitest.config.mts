import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // `import.meta.dirname` en vez de `__dirname`: este fichero es un módulo
      // ESM y en Windows la variante con `new URL().pathname` devuelve rutas
      // del tipo `/C:/...` que no resuelven.
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
