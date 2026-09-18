import { expect, test, type Page } from '@playwright/test'

/** Identifiants publics du compte de démonstration (APP_DEMO_DATA=true). */
const DEMO = { email: 'camille.martin@taskflow.dev', password: process.env.E2E_DEMO_PASSWORD ?? 'Demo2026!' }

async function signInAsDemo(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(DEMO.email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(DEMO.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/tasks/)
}

/** Compte neuf à chaque exécution : le parcours n'altère jamais le compte de démonstration. */
async function registerFreshAccount(page: Page) {
  const stamp = Date.now()
  const account = { email: `e2e.${stamp}@exemple.com`, password: `Parcours-${stamp}` }
  await page.goto('/register')
  await page.getByLabel('Nom complet').fill('Parcours E2E')
  await page.getByLabel('Email').fill(account.email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(account.password)
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page).toHaveURL(/\/tasks/)
  return account
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

test('le compte de démonstration ouvre sur un Kanban rempli', async ({ page }) => {
  await signInAsDemo(page)
  for (const column of ['À faire', 'En cours', 'En revue', 'Terminé']) {
    await expect(page.getByRole('heading', { name: new RegExp(`^${column}`) })).toBeVisible()
  }
  await expect(page.locator('[aria-roledescription]').first()).toBeVisible()
})

test('parcours complet : inscription, créer, déplacer, saisir du temps, feuille de temps, supprimer', async ({ page }) => {
  const title = `Tâche de bout en bout ${Date.now()}`
  await registerFreshAccount(page)

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
  // Déplacement confirmé par le serveur (la carte a fini de changer de colonne)
  await expect(page.getByText(`« ${title} » déplacée vers En cours.`)).toBeVisible()

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

test('premier pas, « terminée » annulable, et session expirée sans perte de saisie', async ({ page }) => {
  const account = await registerFreshAccount(page)

  // Compte neuf : une invitation claire plutôt que quatre colonnes vides
  await page.getByRole('button', { name: 'Créer ma première tâche' }).click()
  await page.getByRole('dialog').getByLabel('Titre').fill('Appeler la mutuelle')
  await page.getByRole('dialog').getByRole('button', { name: 'Créer la tâche' }).click()

  // « Terminée » en un clic, puis « Annuler » depuis le toast
  await page.getByRole('button', { name: 'Marquer « Appeler la mutuelle » comme terminée' }).click()
  await expect(page.getByRole('region', { name: /^Terminé/ }).getByRole('group', { name: 'Appeler la mutuelle' })).toBeVisible()
  await page.getByRole('button', { name: 'Annuler' }).click()
  await expect(page.getByRole('region', { name: /^À faire/ }).getByRole('group', { name: 'Appeler la mutuelle' })).toBeVisible()

  // Session expirée pendant une saisie : message, retour à la page, saisie rendue
  await page.goto('/tasks?view=table&priority=HIGH')
  await page.getByRole('button', { name: 'Créer une tâche', exact: true }).click()
  await page.getByRole('dialog').getByLabel('Titre').fill('Déclarer mes revenus')
  // Le jeton expire pendant la saisie : l'envoi (ou une requête de fond) le révèle.
  await page.evaluate(() => localStorage.setItem('taskflow.accessToken', 'jeton.expire.invalide'))
  await page.getByRole('dialog').getByRole('button', { name: 'Créer la tâche' }).click()
  await expect(page.getByText('Votre session a expiré.', { exact: false })).toBeVisible()
  await page.getByLabel('Email').fill(account.email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(account.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/tasks\?view=table&priority=HIGH/)
  await expect(page.getByRole('dialog').getByLabel('Titre')).toHaveValue('Déclarer mes revenus')
})

test('un rappel choisi arrive dans la cloche et ouvre la tâche', async ({ page }) => {
  test.setTimeout(120_000)
  await registerFreshAccount(page)

  // Rappel « à une date précise » réglé sur maintenant : le générateur le relève au passage suivant.
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
  await page.getByRole('button', { name: 'Créer ma première tâche' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Titre').fill('Rappeler le garagiste')
  await dialog.getByRole('combobox', { name: 'Rappel' }).click()
  await page.getByRole('option', { name: 'À une date précise…' }).click()
  await dialog.getByLabel('Date du rappel').fill(local)
  await dialog.getByRole('button', { name: 'Créer la tâche' }).click()

  const bell = page.getByRole('button', { name: /^Notifications/ })
  await expect(async () => {
    await page.reload()
    await expect(bell).toHaveAccessibleName('Notifications : 1 non lue', { timeout: 2_000 })
  }).toPass({ timeout: 90_000, intervals: [3_000] })

  await bell.click()
  await page.getByRole('button', { name: /Rappel.*Rappeler le garagiste/ }).click()
  await expect(page.getByRole('dialog').getByLabel('Titre')).toHaveValue('Rappeler le garagiste')
  await page.keyboard.press('Escape')
  await expect(bell).toHaveAccessibleName('Notifications')
})
