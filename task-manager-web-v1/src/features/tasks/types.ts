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
  /** Temps total saisi sur la tâche (feuilles de temps), en minutes. */
  timeSpentMinutes: number
}

export type TaskPayload = {
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
}

export type TaskStats = {
  total: number
  byStatus: Record<TaskStatus, number>
  openByPriority: Record<TaskPriority, number>
  overdue: number
  dueThisWeek: number
}

export const TASK_VIEWS = ['kanban', 'table', 'list'] as const
export type TaskView = (typeof TASK_VIEWS)[number]

/** Filtre d'échéance, mêmes définitions que les tuiles du tableau de bord. */
export const TASK_DUE_FILTERS = ['OVERDUE', 'THIS_WEEK'] as const
export type TaskDueFilter = (typeof TASK_DUE_FILTERS)[number]

/** Champs triables côté serveur (liste blanche de l'API). */
export const TASK_SORT_FIELDS = ['dueDate', 'priority', 'status', 'title', 'createdAt'] as const
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number]
export type SortDirection = 'asc' | 'desc'
export type TaskSort = { field: TaskSortField; direction: SortDirection }

export type TaskFilters = {
  search: string
  status: TaskStatus | null
  priority: TaskPriority | null
  due: TaskDueFilter | null
  sort: TaskSort
  page: number
  size: number
}
