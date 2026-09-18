import { taskApi } from '@/features/tasks/api/taskApi'
import { TASKS_QUERY_KEY } from '@/features/tasks/hooks/useTasks'
import type { TaskPayload, TaskStatus } from '@/features/tasks/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * Écritures sur les tâches. L'invalidation du cache remplace tout rechargement manuel :
 * aucun composant n'appelle `refetch` (ADR-016, INV-21).
 * Les erreurs ne sont pas notifiées ici — l'appelant les place dans son formulaire via
 * applyApiErrorToForm, ce qui évite un double message.
 */
export function useTaskMutations() {
  const queryClient = useQueryClient()
  const invalidateTasks = () => queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })

  const createTask = useMutation({
    mutationFn: (payload: TaskPayload) => taskApi.create(payload),
    onSuccess: () => {
      invalidateTasks()
      toast.success('Tâche créée.')
    },
  })

  const updateTask = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TaskPayload }) => taskApi.update(id, payload),
    onSuccess: () => {
      invalidateTasks()
      toast.success('Tâche mise à jour.')
    },
  })

  // L'invalidation est renvoyée : `mutateAsync` n'aboutit qu'une fois les listes
  // rechargées, ce qui permet au Kanban de retirer sa mise à jour optimiste sans à-coup.
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => taskApi.updateStatus(id, status),
    onSuccess: () => invalidateTasks(),
  })

  const deleteTask = useMutation({
    mutationFn: (id: number) => taskApi.remove(id),
    onSuccess: () => {
      invalidateTasks()
      toast.success('Tâche supprimée.')
    },
  })

  return { createTask, updateTask, updateStatus, deleteTask }
}
