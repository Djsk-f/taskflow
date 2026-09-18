/// <reference types="vitest/config" />
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
  // Tests unitaires et de composants (Vitest). Les tests de bout en bout sont dans e2e/.
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Valeur fixe : les tests ne dépendent d'aucun fichier .env (intégration continue).
    env: { VITE_API_BASE_URL: '/api/v1' },
  },
})
