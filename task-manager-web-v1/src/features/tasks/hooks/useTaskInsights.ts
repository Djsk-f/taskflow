import { taskApi } from '@/features/tasks/api/taskApi'
import { TASKS_QUERY_KEY } from '@/features/tasks/hooks/useTasks'
import { useQuery } from '@tanstack/react-query'

/**
 * Lectures agrégées (tableau de bord, cloche). Leurs clés commencent par `tasks` : toute
 * écriture sur une tâche les invalide avec les listes, sans code supplémentaire.
 */
export function useTaskStats() {
  return useQuery({ queryKey: [TASKS_QUERY_KEY, 'stats'], queryFn: taskApi.stats })
}

export function useDueTasks(withinHours: number) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, 'due', withinHours],
    queryFn: () => taskApi.due(withinHours),
    // Une échéance peut devenir « en retard » sans aucune action de l'utilisateur.
    refetchInterval: 60_000,
  })
}
