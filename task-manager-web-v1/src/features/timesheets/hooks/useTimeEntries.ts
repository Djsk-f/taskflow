import { TASKS_QUERY_KEY } from '@/features/tasks/hooks/useTasks'
import { timeEntryApi } from '@/features/timesheets/api/timeEntryApi'
import type { TimeEntryPayload } from '@/features/timesheets/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export const TIME_ENTRIES_QUERY_KEY = 'time-entries'

export function useTimeEntries(from: string, to: string) {
  return useQuery({
    queryKey: [TIME_ENTRIES_QUERY_KEY, from, to],
    queryFn: () => timeEntryApi.list(from, to),
  })
}

export function useTaskTimeEntries(taskId: number | undefined) {
  return useQuery({
    queryKey: [TIME_ENTRIES_QUERY_KEY, 'task', taskId],
    queryFn: () => timeEntryApi.listForTask(taskId as number),
    enabled: taskId !== undefined,
  })
}

/**
 * Écritures de temps. Elles invalident aussi les tâches : le temps total affiché sur les
 * cartes et dans le tableau vient de la tâche elle-même.
 */
export function useTimeEntryMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY] }),
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] }),
    ])

  const createEntry = useMutation({
    mutationFn: (payload: TimeEntryPayload) => timeEntryApi.create(payload),
    onSuccess: () => {
      toast.success(t('timesheets.entry.saved'))
      return invalidate()
    },
  })

  const deleteEntry = useMutation({
    mutationFn: (id: number) => timeEntryApi.remove(id),
    onSuccess: () => {
      toast.success(t('timesheets.entry.deleted'))
      return invalidate()
    },
  })

  return { createEntry, deleteEntry }
}
