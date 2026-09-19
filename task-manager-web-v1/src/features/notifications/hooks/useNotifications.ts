import { notificationApi } from '@/features/notifications/api/notificationApi'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const NOTIFICATIONS_QUERY_KEY = 'notifications'

/**
 * Solution de repli quand le flux temps réel est coupé : le serveur génère les rappels
 * toutes les 30 s, la cloche demande au même rythme.
 */
const POLL_MS = 30_000

/**
 * Filet de sécurité gardé MÊME quand le flux est ouvert. Un flux peut cesser de délivrer
 * sans se fermer (mandataire, onglet en veille) ; sans cette demande lente, la cloche
 * resterait figée indéfiniment. Une requête par minute est un coût négligeable face à
 * une notification jamais affichée.
 */
const STREAMING_POLL_MS = 60_000
const PAGE_SIZE = 10

/**
 * Badge et dernières notifications, interrogés même onglet en arrière-plan : c'est ce
 * qui permet d'afficher une notification du navigateur quand l'utilisateur est ailleurs.
 */
export function useUnreadCount(streaming: boolean) {
  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, 'unread-count'],
    queryFn: notificationApi.unreadCount,
    refetchInterval: streaming ? STREAMING_POLL_MS : POLL_MS,
    refetchIntervalInBackground: true,
  })
}

export function useLatestNotifications(streaming: boolean) {
  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, 'latest'],
    queryFn: () => notificationApi.list(0, PAGE_SIZE),
    refetchInterval: streaming ? STREAMING_POLL_MS : POLL_MS,
    refetchIntervalInBackground: true,
  })
}

/** Liste de la cloche, chargée à l'ouverture, par lots de 10 (« Afficher plus »). */
export function useNotificationFeed(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, 'feed'],
    queryFn: ({ pageParam }) => notificationApi.list(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
    enabled,
  })
}

export const PREFERENCES_QUERY_KEY = [NOTIFICATIONS_QUERY_KEY, 'preferences']

export function useNotificationActions() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] })
  const markRead = useMutation({ mutationFn: notificationApi.markRead, onSuccess: invalidate })
  const markAllRead = useMutation({ mutationFn: notificationApi.markAllRead, onSuccess: invalidate })
  return { markRead, markAllRead }
}
