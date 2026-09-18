import { useAuth } from '@/features/auth/useAuth'
import { FullPageLoader } from '@/shared/components/feedback/FullPageLoader'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

/** Empêche un utilisateur déjà connecté de revenir sur la connexion ou l'inscription. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoring } = useAuth()
  const { t } = useTranslation()

  if (isRestoring) {
    return <FullPageLoader label={t('auth.restoring')} />
  }

  return isAuthenticated ? <Navigate to="/tasks" replace /> : children
}
