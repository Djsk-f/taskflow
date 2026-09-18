import type { AppNotification, NotificationType } from '@/features/notifications/types'
import { AlarmClockIcon, BellRingIcon, CalendarClockIcon, ClockIcon, TimerIcon, type LucideIcon } from 'lucide-react'

type NotificationMeta = {
  /** Clé de traduction du message : `t(meta.labelKey)`. */
  labelKey: `notifications.types.${NotificationType}`
  icon: LucideIcon
  /** Pastille de l'icône, construite sur les jetons du design system. */
  toneClassName: string
  /** Ligne de détail sous le titre (« Échéance : … »), absente si l'instant ne dit rien. */
  subjectKey: 'notifications.dueAt' | 'notifications.remindAt' | null
}

/** Source unique du rendu de chaque type de notification (comme taskMeta pour les tâches). */
export const NOTIFICATION_META = {
  OVERDUE: {
    labelKey: 'notifications.types.OVERDUE',
    icon: AlarmClockIcon,
    toneClassName: 'bg-destructive/10 text-destructive',
    subjectKey: 'notifications.dueAt',
  },
  DUE_IN_1H: {
    labelKey: 'notifications.types.DUE_IN_1H',
    icon: TimerIcon,
    toneClassName: 'bg-warning/15 text-priority-medium-text',
    subjectKey: 'notifications.dueAt',
  },
  DUE_IN_24H: {
    labelKey: 'notifications.types.DUE_IN_24H',
    icon: CalendarClockIcon,
    toneClassName: 'bg-primary/10 text-primary',
    subjectKey: 'notifications.dueAt',
  },
  REMINDER: {
    labelKey: 'notifications.types.REMINDER',
    icon: BellRingIcon,
    toneClassName: 'bg-primary/10 text-primary',
    subjectKey: 'notifications.remindAt',
  },
  NO_TIME_LOGGED: {
    labelKey: 'notifications.types.NO_TIME_LOGGED',
    icon: ClockIcon,
    toneClassName: 'bg-muted text-muted-foreground',
    subjectKey: null,
  },
} as const satisfies Record<NotificationType, NotificationMeta>

/** Destination d'une notification : la tâche ouverte en modification, ou la feuille de temps. */
export function notificationLink(notification: AppNotification): string {
  return notification.taskId ? `/tasks?task=${notification.taskId}` : '/timesheets'
}
