import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_VIEWS,
  type TaskFilters,
  type TaskPriority,
  type TaskStatus,
  type TaskView,
} from '@/features/tasks/types'

export const DEFAULT_PAGE_SIZE = 10
/** Tailles proposées ; 50 est le plafond du serveur. */
export const PAGE_SIZES = [10, 20, 50] as const
export const DEFAULT_VIEW: TaskView = 'kanban'

/**
 * Les filtres vivent dans l'URL : un lien reste partageable, le retour arrière fonctionne,
 * et il n'existe pas de second état local à synchroniser (INV-21/INV-22). Cette lecture et
 * cette écriture sont les seuls points de conversion.
 */
export function readTaskFilters(params: URLSearchParams): TaskFilters {
  return {
    search: params.get('search') ?? '',
    status: parseEnum(params.get('status'), TASK_STATUSES),
    priority: parseEnum(params.get('priority'), TASK_PRIORITIES),
    page: Math.max(0, Number.parseInt(params.get('page') ?? '0', 10) || 0),
    size: parsePageSize(params.get('size')),
  }
}

export function writeTaskFilters(filters: TaskFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) {
    params.set('search', filters.search)
  }
  if (filters.status) {
    params.set('status', filters.status)
  }
  if (filters.priority) {
    params.set('priority', filters.priority)
  }
  if (filters.page > 0) {
    params.set('page', String(filters.page))
  }
  if (filters.size !== DEFAULT_PAGE_SIZE) {
    params.set('size', String(filters.size))
  }
  return params
}

/** La vue (Kanban par défaut) vit dans l'URL comme les filtres : `?view=table`. */
export function readTaskView(params: URLSearchParams): TaskView {
  return parseEnum(params.get('view'), TASK_VIEWS) ?? DEFAULT_VIEW
}

export function withTaskView(params: URLSearchParams, view: TaskView): URLSearchParams {
  const next = new URLSearchParams(params)
  if (view === DEFAULT_VIEW) {
    next.delete('view')
  } else {
    next.set('view', view)
  }
  return next
}

export function hasActiveFilters(filters: TaskFilters): boolean {
  return filters.search !== '' || filters.status !== null || filters.priority !== null
}

function parsePageSize(value: string | null): number {
  const size = Number(value)
  return (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE
}

/** Une valeur d'URL inconnue est ignorée plutôt que transmise au serveur. */
function parseEnum<T extends TaskStatus | TaskPriority | TaskView>(value: string | null, allowed: readonly T[]): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null
}
