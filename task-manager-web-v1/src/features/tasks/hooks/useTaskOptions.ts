import { TASK_PRIORITY_META, TASK_STATUS_META } from '@/features/tasks/taskMeta'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/features/tasks/types'
import { useTranslation } from 'react-i18next'

/** Listes de choix traduites (formulaire, filtres), dérivées de taskMeta. */
export function useTaskOptions() {
  const { t } = useTranslation()
  return {
    statusOptions: TASK_STATUSES.map((value) => ({ value, label: t(TASK_STATUS_META[value].labelKey) })),
    priorityOptions: TASK_PRIORITIES.map((value) => ({ value, label: t(TASK_PRIORITY_META[value].labelKey) })),
  }
}
