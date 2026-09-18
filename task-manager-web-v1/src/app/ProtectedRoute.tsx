import { useAuth } from '@/features/auth/useAuth'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { FullPageLoader } from '@/shared/components/feedback/FullPageLoader'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

/** Refus par défaut côté client, en écho à la règle du serveur (INV-11). */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoring, restoreError, retryRestore } = useAuth()
  const location = useLocation()

  if (isRestoring) {
    return <FullPageLoader label="Restauration de la session…" />
  }

  // Session impossible à vérifier : ni connecté, ni déconnecté. Rediriger vers /login
  // ferait croire à une déconnexion alors que le jeton est peut-être valide.
  if (restoreError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ErrorState message={restoreError} onRetry={retryRestore} />
      </div>
    )
  }

  if (!isAuthenticated) {
    // La page demandée est mémorisée pour y revenir après la connexion.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
