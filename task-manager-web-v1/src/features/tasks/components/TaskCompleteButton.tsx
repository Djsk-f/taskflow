import type { TaskActionHandlers } from '@/features/tasks/components/TaskRowActions'
import type { Task } from '@/features/tasks/types'
import { Button } from '@/shared/ui/button'
import { CircleCheckBigIcon, CircleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** « Terminée » en un clic. Une tâche terminée l'est définitivement : simple coche. */
export function TaskCompleteButton({ task, onMove }: { task: Task } & Pick<TaskActionHandlers, 'onMove'>) {
  const { t } = useTranslation()
  if (task.status === 'DONE') {
    return (
      <span className="text-status-done-text flex size-9 items-center justify-center" title={t('tasks.complete.done')}>
        <CircleCheckBigIcon className="size-4" />
        <span className="sr-only">{t('tasks.complete.done')}</span>
      </span>
    )
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('tasks.complete.mark', { title: task.title })}
      onClick={() => onMove(task, 'DONE')}
      className="text-muted-foreground hover:text-status-done-text"
    >
      <CircleIcon className="size-4" />
    </Button>
  )
}
