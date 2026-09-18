/** Miroir de l'enum NotificationType du serveur. */
export const NOTIFICATION_TYPES = ['DUE_IN_24H', 'DUE_IN_1H', 'OVERDUE', 'REMINDER', 'NO_TIME_LOGGED'] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export type AppNotification = {
  id: number
  type: NotificationType
  taskId?: number
  taskTitle?: string
  /** Instant visé : échéance, heure du rappel choisi, ou fin de journée (saisie du temps). */
  subjectAt: string
  createdAt: string
  read: boolean
}

/** Rappels automatiques voulus (réglés dans le profil). */
export type NotificationPreferences = {
  dueIn24h: boolean
  dueIn1h: boolean
  overdue: boolean
  dailyTimeReminder: boolean
}
