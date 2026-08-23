import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Rutas relativas: el `dist/` resultante se puede abrir desde el disco o
  // colgar de un subdirectorio del sitio sin reconfigurar nada. Es lo que
  // permite servirlo en `/cotizador/` del hub sin tocar nada más.
  base: './',

  server: {
    fs: {
      // `datos/precios.json` vive en la raíz del repositorio, fuera de esta
      // carpeta, y es a propósito: es la fuente de verdad de la marca entera y
      // el cotizador la LEE, no la copia. Sin esto el servidor de desarrollo se
      // niega a servir un archivo de fuera de su raíz.
      allow: ['..'],
    },
  },

  build: {
    rollupOptions: {
      output: {
        // jsPDF pesa más que toda la aplicación: en su propio paquete, la
        // pantalla se dibuja sin tener que analizarlo ni ejecutarlo.
        manualChunks: (id) => (/node_modules\/jspdf/.test(id) ? 'pdf' : undefined),
      },
    },
  },
});
