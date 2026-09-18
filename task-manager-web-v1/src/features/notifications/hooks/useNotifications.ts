import { notificationApi } from '@/features/notifications/api/notificationApi'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const NOTIFICATIONS_QUERY_KEY = 'notifications'

/** Le serveur génère les rappels toutes les 30 s : la cloche se met à jour au même rythme. */
const POLL_MS = 30_000
const PAGE_SIZE = 10

/**
 * Badge et dernières notifications, interrogés même onglet en arrière-plan : c'est ce
 * qui permet d'afficher une notification du navigateur quand l'utilisateur est ailleurs.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, 'unread-count'],
    queryFn: notificationApi.unreadCount,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
  })
}

export function useLatestNotifications() {
  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, 'latest'],
    queryFn: () => notificationApi.list(0, PAGE_SIZE),
    refetchInterval: POLL_MS,
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

export function useNotificationActions() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] })
  const markRead = useMutation({ mutationFn: notificationApi.markRead, onSuccess: invalidate })
  const markAllRead = useMutation({ mutationFn: notificationApi.markAllRead, onSuccess: invalidate })
  return { markRead, markAllRead }
}
