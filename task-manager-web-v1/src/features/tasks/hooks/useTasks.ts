import { taskApi } from '@/features/tasks/api/taskApi'
import type { TaskFilters } from '@/features/tasks/types'
import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

export const TASKS_QUERY_KEY = 'tasks'

/**
 * Définition unique d'une requête de liste, partagée par le tableau, la liste et les
 * colonnes du Kanban. `keepPreviousData` conserve l'affichage pendant le chargement
 * suivant : pagination et filtres ne font pas clignoter l'écran.
 */
export function tasksQueryOptions(filters: TaskFilters) {
  return queryOptions({
    queryKey: [TASKS_QUERY_KEY, filters],
    queryFn: () => taskApi.list(filters),
    placeholderData: keepPreviousData,
  })
}

export function useTasks(filters: TaskFilters) {
  return useQuery(tasksQueryOptions(filters))
}
