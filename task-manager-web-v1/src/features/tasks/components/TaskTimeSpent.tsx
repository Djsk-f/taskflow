import type { Task } from '@/features/tasks/types'
import { formatDuration } from '@/shared/lib/duration'
import { ClockIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Temps total saisi sur une tâche ; rien si aucun temps (sauf `showEmpty`, pour le tableau). */
export function TaskTimeSpent({ task, showEmpty = false }: { task: Task; showEmpty?: boolean }) {
  // Abonnement à la langue : le format de durée change avec elle.
  useTranslation()
  if (task.timeSpentMinutes <= 0) {
    return showEmpty ? <span className="text-muted-foreground text-sm">—</span> : null
  }
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium tabular-nums">
      <ClockIcon className="size-3.5" />
      {formatDuration(task.timeSpentMinutes)}
    </span>
  )
}
