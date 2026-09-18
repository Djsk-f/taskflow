import { TASK_STATUS_META } from '@/features/tasks/taskMeta'
import { TASK_STATUSES, type Task, type TaskStatus } from '@/features/tasks/types'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'

/** Actions possibles sur une tâche, transmises telles quelles par chaque vue. */
export type TaskActionHandlers = {
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onMove: (task: Task, status: TaskStatus) => void
}

/**
 * Menu d'actions d'une tâche, commun au tableau, à la liste et aux cartes Kanban.
 * « Déplacer vers » est l'alternative clavier et tactile au glisser-déposer.
 */
export function TaskRowActions({ task, onEdit, onDelete, onMove }: { task: Task } & TaskActionHandlers) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions sur « ${task.title} »`}>
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => onEdit(task)}>
          <PencilIcon className="size-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Déplacer vers</DropdownMenuLabel>
        {TASK_STATUSES.filter((status) => status !== task.status).map((status) => {
          const meta = TASK_STATUS_META[status]
          return (
            <DropdownMenuItem key={status} onSelect={() => onMove(task, status)}>
              <meta.icon className="size-4" />
              {meta.label}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(task)}>
          <Trash2Icon className="size-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
