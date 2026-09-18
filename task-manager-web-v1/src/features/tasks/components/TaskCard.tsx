import { TaskPriorityBadge } from '@/features/tasks/components/TaskBadges'
import { TaskDueDate } from '@/features/tasks/components/TaskDueDate'
import { TaskTimeSpent } from '@/features/tasks/components/TaskTimeSpent'
import { TaskRowActions, type TaskActionHandlers } from '@/features/tasks/components/TaskRowActions'
import type { Task } from '@/features/tasks/types'
import { cn } from '@/shared/lib/utils'
import { useDraggable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'

type TaskCardProps = { task: Task } & TaskActionHandlers

const CARD_CLASS =
  'bg-card shadow-card rounded-xl border p-4 transition-shadow outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

/**
 * Carte Kanban calquée sur la capture : titre en gras, échéance en bleu, description sur
 * trois lignes, pied de carte avec la priorité (notre équivalent du badge de la capture).
 * Toute la carte se saisit pour le glisser-déposer ; le titre ouvre la modification.
 */
export function TaskCard({ task, ...actions }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task } })
  const { t } = useTranslation()

  return (
    <article
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-roledescription={t('tasks.kanban.draggable')}
      aria-label={task.title}
      className={cn(
        CARD_CLASS,
        'cursor-grab touch-manipulation hover:shadow-[var(--shadow-card-hover)] active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      <TaskCardContent task={task} {...actions} />
    </article>
  )
}

/** Copie affichée sous le pointeur pendant le glissement (sans logique de déplacement). */
export function TaskCardPreview({ task, ...actions }: TaskCardProps) {
  return (
    <article className={cn(CARD_CLASS, 'rotate-2 cursor-grabbing shadow-[var(--shadow-card-hover)]')}>
      <TaskCardContent task={task} {...actions} />
    </article>
  )
}

function TaskCardContent({ task, ...actions }: TaskCardProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => actions.onEdit(task)}
        {...stopDrag}
        className="hover:text-primary w-full text-left text-sm font-semibold [overflow-wrap:anywhere] focus-visible:underline focus-visible:outline-none"
      >
        {task.title}
      </button>
      <div className="mt-1">
        <TaskDueDate task={task} compact />
      </div>
      {task.description && (
        <p className="text-muted-foreground mt-2 line-clamp-3 text-xs leading-relaxed [overflow-wrap:anywhere]">
          {task.description}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between border-t pt-2">
        <div className="flex items-center gap-2">
          <TaskPriorityBadge priority={task.priority} />
          <TaskTimeSpent task={task} />
        </div>
        <div {...stopDrag}>
          <TaskRowActions task={task} {...actions} />
        </div>
      </div>
    </>
  )
}

/** Les contrôles internes de la carte ne doivent pas déclencher le glisser-déposer. */
const stopPropagation = (event: { stopPropagation: () => void }) => event.stopPropagation()
const stopDrag = { onPointerDown: stopPropagation, onKeyDown: stopPropagation }
