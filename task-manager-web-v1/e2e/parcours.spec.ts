import { expect, test, type Page } from '@playwright/test'

/** Identifiants publics du compte de démonstration (APP_DEMO_DATA=true). */
const DEMO = { email: 'camille.martin@taskflow.dev', password: process.env.E2E_DEMO_PASSWORD ?? 'Demo2026!' }

async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(DEMO.email)
  await page.getByLabel('Mot de passe').fill(DEMO.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/tasks/)
}

test('les pages privées renvoient vers la connexion', async ({ page }) => {
  await page.goto('/timesheets')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible()
})

test('la langue bascule en anglais et le reste', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('parcours complet : créer, déplacer, saisir du temps, retrouver dans la feuille, supprimer', async ({ page }) => {
  const title = `Tâche de bout en bout ${Date.now()}`
  await signIn(page)

  // Kanban par défaut, quatre colonnes
  for (const column of ['À faire', 'En cours', 'En revue', 'Terminé']) {
    await expect(page.getByRole('heading', { name: new RegExp(`^${column}`) })).toBeVisible()
  }

  // Création
  await page.getByRole('button', { name: 'Créer une tâche' }).first().click()
  await page.getByRole('dialog').getByLabel('Titre').fill(title)
  await page.getByRole('dialog').getByRole('button', { name: 'Créer la tâche' }).click()
  const todo = page.getByRole('region', { name: /^À faire/ })
  await expect(todo.getByRole('group', { name: title })).toBeVisible()

  // Déplacement vers « En cours » (alternative accessible au glisser-déposer)
  await page.getByRole('button', { name: `Actions sur « ${title} »` }).click()
  await page.getByRole('menuitem', { name: 'En cours' }).click()
  const inProgress = page.getByRole('region', { name: /^En cours/ })
  await expect(inProgress.getByRole('group', { name: title })).toBeVisible()

  // Saisie de temps
  await page.getByRole('button', { name: `Actions sur « ${title} »` }).click()
  await page.getByRole('menuitem', { name: 'Saisir du temps' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Durée').fill('1h30')
  await dialog.getByRole('button', { name: 'Ajouter' }).click()
  await expect(dialog.getByText('Total : 1 h 30')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(inProgress.getByRole('group', { name: title }).getByText('1 h 30')).toBeVisible()

  // Feuille de temps de la semaine
  await page.getByRole('link', { name: 'Feuilles de temps' }).click()
  const row = page.getByRole('row', { name: new RegExp(title) })
  await expect(row).toContainText('1 h 30')

  // Nettoyage : suppression (confirmation obligatoire)
  await page.getByRole('link', { name: 'Tâches' }).click()
  await page.getByRole('button', { name: `Actions sur « ${title} »` }).click()
  await page.getByRole('menuitem', { name: 'Supprimer' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Supprimer' }).click()
  await expect(page.getByRole('group', { name: title })).toHaveCount(0)
})
