import { taskApi } from '@/features/tasks/api/taskApi'
import { NOTIFICATIONS_QUERY_KEY } from '@/features/notifications/hooks/useNotifications'
import { TASKS_QUERY_KEY } from '@/features/tasks/hooks/useTasks'
import { TIME_ENTRIES_QUERY_KEY } from '@/features/timesheets/hooks/useTimeEntries'
import type { TaskPayload, TaskStatus } from '@/features/tasks/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

/**
 * Écritures sur les tâches. L'invalidation du cache remplace tout rechargement manuel :
 * aucun composant n'appelle `refetch` (ADR-016, INV-21).
 * Les erreurs ne sont pas notifiées ici — l'appelant les place dans son formulaire via
 * applyApiErrorToForm, ce qui évite un double message.
 */
export function useTaskMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  // Modifier une tâche peut retirer ses rappels (échéance déplacée, tâche terminée).
  const invalidateTasks = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] }),
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] }),
      // Quitter « En cours » enregistre le chrono dans la feuille de temps.
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY] }),
    ])

  const createTask = useMutation({
    mutationFn: (payload: TaskPayload) => taskApi.create(payload),
    onSuccess: () => {
      invalidateTasks()
      toast.success(t('tasks.created'))
    },
  })

  const updateTask = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TaskPayload }) => taskApi.update(id, payload),
    onSuccess: () => {
      invalidateTasks()
      toast.success(t('tasks.updated'))
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
      toast.success(t('tasks.deleted'))
    },
  })

  return { createTask, updateTask, updateStatus, deleteTask }
}
