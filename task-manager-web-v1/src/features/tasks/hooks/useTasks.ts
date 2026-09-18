import { taskApi } from '@/features/tasks/api/taskApi'
import type { TaskFilters } from '@/features/tasks/types'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

export const TASKS_QUERY_KEY = 'tasks'

/**
 * Liste paginée et filtrée. `keepPreviousData` conserve la page précédente pendant le
 * chargement de la suivante : la pagination ne fait pas clignoter le tableau.
 */
export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, filters],
    queryFn: () => taskApi.list(filters),
    placeholderData: keepPreviousData,
  })
}
