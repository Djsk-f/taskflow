import { useAuth } from '@/features/auth/useAuth'
import { FullPageLoader } from '@/shared/components/feedback/FullPageLoader'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router-dom'

/** Empêche un utilisateur déjà connecté de revenir sur la connexion ou l'inscription. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoring } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

  if (isRestoring) {
    return <FullPageLoader label={t('auth.restoring')} />
  }

  // Juste après la connexion, cette redirection part la première : elle doit donc elle
  // aussi ramener à la page d'où la session expirée avait éjecté l'utilisateur.
  const from = (location.state as { from?: string } | null)?.from
  return isAuthenticated ? <Navigate to={from ?? '/tasks'} replace /> : children
}
