import type { TaskActionHandlers } from '@/features/tasks/components/TaskRowActions'
import type { Task } from '@/features/tasks/types'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { CircleCheckBigIcon, CircleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * Case « terminée » en un geste, à côté du menu d'actions : c'est l'action la plus
 * fréquente, elle ne doit pas se cacher sous « Déplacer vers ». Une tâche terminée
 * se rouvre « À faire » ; le toast propose d'annuler.
 */
export function TaskCompleteButton({ task, onMove }: { task: Task } & Pick<TaskActionHandlers, 'onMove'>) {
  const { t } = useTranslation()
  const done = task.status === 'DONE'
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={done}
      aria-label={done ? t('tasks.complete.reopen', { title: task.title }) : t('tasks.complete.mark', { title: task.title })}
      onClick={() => onMove(task, done ? 'TODO' : 'DONE')}
      className={cn(done ? 'text-status-done-text' : 'text-muted-foreground hover:text-status-done-text')}
    >
      {done ? <CircleCheckBigIcon className="size-4" /> : <CircleIcon className="size-4" />}
    </Button>
  )
}
