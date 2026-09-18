import { AuthContext, type AuthState } from '@/features/auth/AuthContext'
import { useContext } from 'react'

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur de AuthProvider.')
  }
  return context
}
