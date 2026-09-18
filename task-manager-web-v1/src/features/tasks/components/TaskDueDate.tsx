import type { Task } from '@/features/tasks/types'
import { formatDateTime, formatShortDateTime, isOverdue } from '@/shared/lib/formatDate'
import { cn } from '@/shared/lib/utils'
import { CalendarClockIcon } from 'lucide-react'

/**
 * Échéance d'une tâche, rendue au même endroit pour le tableau, la liste et les cartes.
 * Dépassée, elle passe en rouge — sauf si la tâche est terminée.
 * `compact` : format court et couleur primaire des cartes Kanban, comme la capture.
 */
export function TaskDueDate({ task, compact = false }: { task: Task; compact?: boolean }) {
  if (!task.dueDate) {
    return compact ? null : <span className="text-muted-foreground text-sm">—</span>
  }
  const late = task.status !== 'DONE' && isOverdue(task.dueDate)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        compact ? 'text-xs font-medium' : 'text-sm',
        late ? 'text-destructive font-medium' : compact ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <CalendarClockIcon className="size-3.5" />
      {compact ? formatShortDateTime(task.dueDate) : formatDateTime(task.dueDate)}
      {late && <span className="sr-only">(en retard)</span>}
    </span>
  )
}
