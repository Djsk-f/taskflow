import { THEME_STORAGE_KEY, ThemeContext, type Theme } from '@/shared/theme/themeContext'
import { useMemo, useState, type ReactNode } from 'react'

/**
 * Mode sombre (bonus B-02). Le thème initial a déjà été appliqué par le script d'index.html
 * (choix mémorisé, sinon préférence du système) : on le lit sur <html> pour ne jamais
 * afficher un flash de la mauvaise couleur. Les couleurs viennent des jetons `.dark`.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  const value = useMemo(
    () => ({
      theme,
      setTheme: (next: Theme) => {
        document.documentElement.classList.toggle('dark', next === 'dark')
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next)
        } catch {
          // Stockage indisponible (navigation privée) : le thème vaut pour la session.
        }
        setThemeState(next)
      },
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
