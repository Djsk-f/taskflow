import { TaskCard } from '@/features/tasks/components/TaskCard'
import type { TaskActionHandlers } from '@/features/tasks/components/TaskRowActions'
import { TASK_STATUS_META } from '@/features/tasks/taskMeta'
import type { Task, TaskStatus } from '@/features/tasks/types'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Skeleton } from '@/shared/ui/skeleton'
import { useDroppable } from '@dnd-kit/core'
import { MoreHorizontalIcon, PlusIcon, Table2Icon } from 'lucide-react'

type KanbanColumnProps = {
  status: TaskStatus
  tasks: Task[]
  /** Nombre total de tâches de ce statut (toutes ne sont pas forcément chargées). */
  total: number
  isLoading: boolean
  onCreate: (status: TaskStatus) => void
  onShowInTable: (status: TaskStatus) => void
} & TaskActionHandlers

/** Colonne de statut : titre coloré et compteur « (03) » comme la capture, zone de dépôt. */
export function KanbanColumn({
  status,
  tasks,
  total,
  isLoading,
  onCreate,
  onShowInTable,
  ...actions
}: KanbanColumnProps) {
  const meta = TASK_STATUS_META[status]
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const hidden = total - tasks.length

  return (
    <section aria-labelledby={`column-${status}`} className="flex min-w-0 snap-start flex-col">
      <header className="mb-3 flex items-center gap-1">
        <h2 id={`column-${status}`} className={cn('text-sm font-semibold', meta.textClassName)}>
          {meta.label}
          <span className="text-muted-foreground ml-1 font-normal">({String(total).padStart(2, '0')})</span>
        </h2>
        <div className="ml-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={() => onCreate(status)}
            aria-label={`Créer une tâche dans « ${meta.label} »`}
          >
            <PlusIcon className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={`Options de la colonne « ${meta.label} »`}>
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onShowInTable(status)}>
                <Table2Icon className="size-4" />
                Voir dans le tableau
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-40 flex-1 flex-col gap-3 rounded-xl p-1 transition-colors',
          isOver && 'bg-secondary/60 ring-primary/40 ring-2 ring-dashed',
        )}
      >
        {isLoading &&
          Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-32 w-full rounded-xl" />)}

        {!isLoading && tasks.map((task) => <TaskCard key={task.id} task={task} {...actions} />)}

        {!isLoading && tasks.length === 0 && (
          <p className="text-muted-foreground flex min-h-32 items-center justify-center rounded-xl border border-dashed text-xs">
            Aucune tâche
          </p>
        )}

        {!isLoading && hidden > 0 && (
          <Button variant="ghost" className="text-muted-foreground" onClick={() => onShowInTable(status)}>
            {hidden} autre{hidden > 1 ? 's' : ''} — voir dans le tableau
          </Button>
        )}
      </div>
    </section>
  )
}
