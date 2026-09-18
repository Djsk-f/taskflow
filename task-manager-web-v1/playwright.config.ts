import { defineConfig, devices } from '@playwright/test'

/**
 * Tests de bout en bout sur l'application complète (docker compose : nginx + API + MySQL,
 * compte de démonstration activé). Cible : E2E_BASE_URL, par défaut http://localhost:3000.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
