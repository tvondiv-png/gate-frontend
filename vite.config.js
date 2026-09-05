import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          // Núcleo do React num chunk próprio, cacheável entre deploys.
          // jspdf/html2canvas NÃO entram aqui de propósito: só são
          // importados por páginas lazy, então o Vite já os separa
          // num chunk que carrega apenas nessas telas.
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
