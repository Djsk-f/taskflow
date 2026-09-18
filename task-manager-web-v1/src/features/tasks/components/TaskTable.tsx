import { TaskPriorityBadge, TaskStatusBadge } from '@/features/tasks/components/TaskBadges'
import { TaskCompleteButton } from '@/features/tasks/components/TaskCompleteButton'
import { TaskDueDate } from '@/features/tasks/components/TaskDueDate'
import { TaskTimeSpent } from '@/features/tasks/components/TaskTimeSpent'
import { TaskList } from '@/features/tasks/components/TaskList'
import { TaskRowActions, type TaskActionHandlers } from '@/features/tasks/components/TaskRowActions'
import { toggleSort } from '@/features/tasks/taskFilters'
import type { Task, TaskSort, TaskSortField } from '@/features/tasks/types'
import { cn } from '@/shared/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type TaskTableProps = {
  tasks: Task[]
  sort: TaskSort
  onSortChange: (sort: TaskSort) => void
} & TaskActionHandlers

/**
 * Vue « Grille » à partir de 768 px, liste empilée en dessous (EX-13) : les deux rendus
 * partagent badges, échéance et actions, seule la mise en page change. Les en-têtes
 * trient ; sur mobile, le menu « Trier » de la barre d'outils prend le relais.
 */
export function TaskTable({ tasks, sort, onSortChange, ...actions }: TaskTableProps) {
  const { t } = useTranslation()
  const header = (field: TaskSortField, label: string, className?: string) => (
    <SortableHead field={field} label={label} sort={sort} onSortChange={onSortChange} className={className} />
  )
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {header('title', t('tasks.table.task'))}
              {header('status', t('tasks.table.status'), 'w-36')}
              {header('priority', t('tasks.table.priority'), 'w-36')}
              {header('dueDate', t('tasks.table.dueDate'), 'w-48')}
              <TableHead className="w-24">{t('tasks.table.time')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="max-w-md">
                  <p className="font-medium [overflow-wrap:anywhere]">{task.title}</p>
                  {task.description && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm [overflow-wrap:anywhere]">
                      {task.description}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <TaskStatusBadge status={task.status} />
                </TableCell>
                <TableCell>
                  <TaskPriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell>
                  <TaskDueDate task={task} />
                </TableCell>
                <TableCell>
                  <TaskTimeSpent task={task} showEmpty />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end">
                    <TaskCompleteButton task={task} onMove={actions.onMove} />
                    <TaskRowActions task={task} {...actions} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden">
        <TaskList tasks={tasks} {...actions} />
      </div>
    </>
  )
}

type SortableHeadProps = {
  field: TaskSortField
  label: string
  sort: TaskSort
  onSortChange: (sort: TaskSort) => void
  className?: string
}

/** En-tête cliquable ; `aria-sort` dit aux lecteurs d'écran quelle colonne trie et dans quel sens. */
function SortableHead({ field, label, sort, onSortChange, className }: SortableHeadProps) {
  const { t } = useTranslation()
  const active = sort.field === field
  const Icon = !active ? ArrowUpDownIcon : sort.direction === 'asc' ? ArrowUpIcon : ArrowDownIcon
  return (
    <TableHead
      className={className}
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button
        type="button"
        onClick={() => onSortChange(toggleSort(sort, field))}
        aria-label={t('tasks.sort.by', { column: label })}
        className={cn(
          'hover:text-foreground focus-visible:ring-ring/50 -mx-2 inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 outline-none focus-visible:ring-[3px]',
          active && 'text-foreground',
        )}
      >
        {label}
        <Icon className={cn('size-3.5', !active && 'opacity-40')} />
      </button>
    </TableHead>
  )
}
