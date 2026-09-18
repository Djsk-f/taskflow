import { createContext } from 'react'

export type Theme = 'light' | 'dark'

/** Même clé que le script d'index.html, qui applique le thème avant le premier rendu. */
export const THEME_STORAGE_KEY = 'taskflow.theme'

export type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeState | null>(null)
