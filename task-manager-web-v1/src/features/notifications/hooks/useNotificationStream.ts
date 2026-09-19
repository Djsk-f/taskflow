import { useAuth } from '@/features/auth/useAuth'
import { NOTIFICATIONS_QUERY_KEY } from '@/features/notifications/hooks/useNotifications'
import { openNotificationStream } from '@/shared/api/notificationStream'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

/**
 * Abonnement au flux temps réel tant que l'utilisateur est connecté. Renvoie `true` quand
 * le flux est ouvert : la cloche cesse alors d'interroger l'API toutes les 30 s, et la
 * reprend dès que le flux tombe.
 */
export function useNotificationStream(): boolean {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    return openNotificationStream({
      onEvent: () => void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] }),
      onConnectionChange: setConnected,
    })
  }, [isAuthenticated, queryClient])

  return connected
}
