import { ThemeContext, type ThemeState } from '@/shared/theme/themeContext'
import { useContext } from 'react'

export function useTheme(): ThemeState {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme doit être utilisé sous <ThemeProvider>.')
  }
  return context
}
