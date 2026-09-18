import { TASK_PRIORITY_META, TASK_STATUS_META, type TaskMeta } from '@/features/tasks/taskMeta'
import type { TaskPriority, TaskStatus } from '@/features/tasks/types'
import { cn } from '@/shared/lib/utils'

/**
 * Les deux badges dérivent entièrement de taskMeta : ajouter un statut ne demande aucune
 * modification ici (INV-21, INV-23/O).
 */
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <MetaBadge meta={TASK_STATUS_META[status]} />
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return <MetaBadge meta={TASK_PRIORITY_META[priority]} />
}

function MetaBadge({ meta }: { meta: TaskMeta }) {
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        meta.badgeClassName,
      )}
    >
      <Icon className="size-3.5" />
      {meta.label}
    </span>
  )
}
