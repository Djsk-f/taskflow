import { TaskPriorityBadge } from '@/features/tasks/components/TaskBadges'
import { TaskCompleteButton } from '@/features/tasks/components/TaskCompleteButton'
import { TaskDueDate } from '@/features/tasks/components/TaskDueDate'
import { TaskReminder } from '@/features/tasks/components/TaskReminder'
import { TaskTimeSpent } from '@/features/tasks/components/TaskTimeSpent'
import { TaskTimer } from '@/features/tasks/components/TaskTimer'
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
  // Une tâche terminée ne quitte plus sa colonne.
  const locked = task.status === 'DONE'
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task }, disabled: locked })
  const { t } = useTranslation()

  return (
    <article
      ref={setNodeRef}
      // Carte verrouillée : aucun attribut de glisser-déposer, sinon son aria-disabled
      // désactiverait aussi les boutons qu'elle contient.
      {...(locked ? {} : { ...listeners, ...attributes })}
      // dnd-kit pose role="button" ; or la carte contient des boutons (titre, menu), et un
      // bouton ne doit pas en contenir d'autres. « group » garde focus, description et
      // instructions clavier du glisser-déposer.
      role="group"
      aria-roledescription={locked ? undefined : t('tasks.kanban.draggable')}
      aria-label={task.title}
      className={cn(
        CARD_CLASS,
        !locked && 'cursor-grab touch-manipulation active:cursor-grabbing',
        'hover:shadow-[var(--shadow-card-hover)]',
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
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <TaskDueDate task={task} compact />
        <TaskReminder task={task} />
      </div>
      {task.description && (
        <p className="text-muted-foreground mt-2 line-clamp-3 text-xs leading-relaxed [overflow-wrap:anywhere]">
          {task.description}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2">
        {/* Les badges passent à la ligne : les boutons restent dans la carte. */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <TaskPriorityBadge priority={task.priority} />
          <TaskTimeSpent task={task} />
          {task.timerStartedAt && <TaskTimer startedAt={task.timerStartedAt} />}
        </div>
        <div className="flex shrink-0 items-center" {...stopDrag}>
          <TaskCompleteButton task={task} onMove={actions.onMove} />
          <TaskRowActions task={task} {...actions} />
        </div>
      </div>
    </>
  )
}

/** Les contrôles internes de la carte ne doivent pas déclencher le glisser-déposer. */
const stopPropagation = (event: { stopPropagation: () => void }) => event.stopPropagation()
const stopDrag = { onPointerDown: stopPropagation, onKeyDown: stopPropagation }
