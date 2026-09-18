import { useAuth } from '@/features/auth/useAuth'
import { browserNotificationState } from '@/features/notifications/browserNotifications'
import { useNotificationActions } from '@/features/notifications/hooks/useNotifications'
import { NOTIFICATION_META, notificationLink } from '@/features/notifications/notificationMeta'
import type { AppNotification } from '@/features/notifications/types'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

/** Au plus trois bulles système d'un coup : au-delà, la cloche suffit. */
const MAX_AT_ONCE = 3

/**
 * Relaie les nouvelles notifications au système quand l'utilisateur regarde ailleurs
 * (onglet en arrière-plan, autre fenêtre). Le dernier identifiant relayé est retenu par
 * compte : un rechargement ne rejoue rien, et la première visite ne déverse pas
 * l'historique. Un clic sur la bulle ramène sur la tâche.
 */
export function useBrowserNotifications(latest: AppNotification[] | undefined) {
  const { user } = useAuth()
  const { markRead } = useNotificationActions()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!latest || !user) {
      return
    }
    const key = `taskflow.lastNotified.${user.id}`
    const last = readNumber(key)
    const newest = Math.max(last ?? 0, ...latest.map((notification) => notification.id))
    writeNumber(key, newest)
    if (last === null || browserNotificationState() !== 'on' || document.hasFocus()) {
      return
    }
    latest
      .filter((notification) => !notification.read && notification.id > last)
      .slice(0, MAX_AT_ONCE)
      .forEach((notification) => {
        const bubble = new Notification(t(NOTIFICATION_META[notification.type].labelKey), {
          body: notification.taskTitle ?? '',
          tag: `taskflow-${notification.id}`,
          icon: '/favicon.svg',
        })
        bubble.onclick = () => {
          window.focus()
          markRead.mutate(notification.id)
          navigate(notificationLink(notification))
          bubble.close()
        }
      })
  }, [latest, user]) // eslint-disable-line react-hooks/exhaustive-deps
}

function readNumber(key: string): number | null {
  try {
    const value = localStorage.getItem(key)
    return value === null ? null : Number(value) || 0
  } catch {
    return null
  }
}

function writeNumber(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // sans stockage, on relaiera seulement pendant la visite
  }
}
