/** Miroir des enums du serveur (.brain/04-MODELE-DONNEES.md) : valeurs figées. */
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

/** Les champs optionnels sont omis par le serveur (sérialisation `non_null`), pas nuls. */
export type Task = {
  id: number
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export type TaskPayload = {
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
}

export type TaskFilters = {
  search: string
  status: TaskStatus | null
  priority: TaskPriority | null
  page: number
  size: number
}
