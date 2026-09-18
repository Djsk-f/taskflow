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
import { ClockPlusIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Actions possibles sur une tâche, transmises telles quelles par chaque vue. */
export type TaskActionHandlers = {
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onMove: (task: Task, status: TaskStatus) => void
  onLogTime: (task: Task) => void
}

/**
 * Menu d'actions d'une tâche, commun au tableau, à la liste et aux cartes Kanban.
 * « Déplacer vers » est l'alternative clavier et tactile au glisser-déposer.
 */
export function TaskRowActions({ task, onEdit, onDelete, onMove, onLogTime }: { task: Task } & TaskActionHandlers) {
  const { t } = useTranslation()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('tasks.actions.label', { title: task.title })}>
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => onEdit(task)}>
          <PencilIcon className="size-4" />
          {t('tasks.actions.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onLogTime(task)}>
          <ClockPlusIcon className="size-4" />
          {t('tasks.actions.logTime')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">{t('tasks.actions.moveTo')}</DropdownMenuLabel>
        {TASK_STATUSES.filter((status) => status !== task.status).map((status) => {
          const meta = TASK_STATUS_META[status]
          return (
            <DropdownMenuItem key={status} onSelect={() => onMove(task, status)}>
              <meta.icon className="size-4" />
              {t(meta.labelKey)}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(task)}>
          <Trash2Icon className="size-4" />
          {t('tasks.actions.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
