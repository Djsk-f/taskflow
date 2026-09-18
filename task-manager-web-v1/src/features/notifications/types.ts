/** Miroir de l'enum NotificationType du serveur. */
export const NOTIFICATION_TYPES = ['DUE_IN_24H', 'DUE_IN_1H', 'OVERDUE'] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export type AppNotification = {
  id: number
  type: NotificationType
  taskId?: number
  taskTitle?: string
  /** Instant visé : l'échéance de la tâche au moment du rappel. */
  subjectAt: string
  createdAt: string
  read: boolean
}
