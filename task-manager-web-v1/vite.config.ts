import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Les variables sont lues à la racine du dépôt : un seul .env pour l'API et le web.
  // Seules celles préfixées VITE_ sont exposées au navigateur (les identifiants MySQL
  // du même fichier ne peuvent donc pas se retrouver dans le bundle).
  envDir: path.resolve(import.meta.dirname, '..'),
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
})
