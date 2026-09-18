import type { Task } from '@/features/tasks/types'
import { formatShortDateTime, isPast } from '@/shared/lib/formatDate'
import { BellRingIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Rappel à venir d'une tâche non terminée ; rien une fois passé ou la tâche finie. */
export function TaskReminder({ task }: { task: Task }) {
  const { t } = useTranslation()
  if (!task.reminderAt || task.status === 'DONE' || isPast(task.reminderAt)) {
    return null
  }
  const when = formatShortDateTime(task.reminderAt)
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs whitespace-nowrap" title={t('tasks.reminder', { date: when })}>
      <BellRingIcon className="size-3.5" />
      <span className="sr-only">{t('tasks.reminderLabel')}</span>
      {when}
    </span>
  )
}
