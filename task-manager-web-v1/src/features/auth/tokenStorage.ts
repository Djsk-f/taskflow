const TOKEN_KEY = 'taskflow.accessToken'

/**
 * Unique point d'accès au jeton persisté (INV-21). Le stockage local est un choix assumé
 * et documenté : voir ADR-007 et les limites connues du README.
 */
export const tokenStorage = {
  read(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },

  write(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // Navigation privée ou stockage refusé : la session reste valable en mémoire.
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Rien à faire : l'absence de jeton est déjà l'état recherché.
    }
  },
}
