import type { AppNotification, NotificationType } from '@/features/notifications/types'
import { AlarmClockIcon, CalendarClockIcon, TimerIcon, type LucideIcon } from 'lucide-react'

type NotificationMeta = {
  /** Clé de traduction du message : `t(meta.labelKey)`. */
  labelKey: `notifications.types.${NotificationType}`
  icon: LucideIcon
  /** Pastille de l'icône, construite sur les jetons du design system. */
  toneClassName: string
}

/** Source unique du rendu de chaque type de notification (comme taskMeta pour les tâches). */
export const NOTIFICATION_META = {
  OVERDUE: {
    labelKey: 'notifications.types.OVERDUE',
    icon: AlarmClockIcon,
    toneClassName: 'bg-destructive/10 text-destructive',
  },
  DUE_IN_1H: {
    labelKey: 'notifications.types.DUE_IN_1H',
    icon: TimerIcon,
    toneClassName: 'bg-warning/15 text-priority-medium-text',
  },
  DUE_IN_24H: {
    labelKey: 'notifications.types.DUE_IN_24H',
    icon: CalendarClockIcon,
    toneClassName: 'bg-primary/10 text-primary',
  },
} as const satisfies Record<NotificationType, NotificationMeta>

/** Destination d'une notification : la tâche, ouverte en modification. */
export function notificationLink(notification: AppNotification): string {
  return notification.taskId ? `/tasks?task=${notification.taskId}` : '/tasks'
}
