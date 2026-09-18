import { TASK_PRIORITIES, TASK_STATUSES, type TaskFilters, type TaskPriority, type TaskStatus } from '@/features/tasks/types'

export const DEFAULT_PAGE_SIZE = 10

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
    size: DEFAULT_PAGE_SIZE,
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
  return params
}

export function hasActiveFilters(filters: TaskFilters): boolean {
  return filters.search !== '' || filters.status !== null || filters.priority !== null
}

/** Une valeur d'URL inconnue est ignorée plutôt que transmise au serveur. */
function parseEnum<T extends TaskStatus | TaskPriority>(value: string | null, allowed: readonly T[]): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null
}
