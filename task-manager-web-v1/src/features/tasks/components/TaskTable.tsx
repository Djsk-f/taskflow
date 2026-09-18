import { TaskPriorityBadge, TaskStatusBadge } from '@/features/tasks/components/TaskBadges'
import { TaskRowActions } from '@/features/tasks/components/TaskRowActions'
import type { Task } from '@/features/tasks/types'
import { formatDateTime, isOverdue } from '@/shared/lib/formatDate'
import { cn } from '@/shared/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { CalendarClockIcon } from 'lucide-react'

type TaskTableProps = {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

/**
 * Vue tableau à partir de 768 px, cartes empilées en dessous (EX-13). Les deux rendus
 * partagent les badges et les actions : seule la mise en page change.
 */
export function TaskTable({ tasks, onEdit, onDelete }: TaskTableProps) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tâche</TableHead>
              <TableHead className="w-36">Statut</TableHead>
              <TableHead className="w-36">Priorité</TableHead>
              <TableHead className="w-48">Échéance</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="max-w-md">
                  <p className="font-medium [overflow-wrap:anywhere]">{task.title}</p>
                  {task.description && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm [overflow-wrap:anywhere]">{task.description}</p>
                  )}
                </TableCell>
                <TableCell>
                  <TaskStatusBadge status={task.status} />
                </TableCell>
                <TableCell>
                  <TaskPriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell>
                  <DueDate task={task} />
                </TableCell>
                <TableCell>
                  <TaskRowActions task={task} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y md:hidden">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-start gap-3 px-4 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium [overflow-wrap:anywhere]">{task.title}</p>
              {task.description && (
                <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm [overflow-wrap:anywhere]">{task.description}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
              </div>
              {task.dueDate && (
                <div className="mt-2">
                  <DueDate task={task} />
                </div>
              )}
            </div>
            <TaskRowActions task={task} onEdit={onEdit} onDelete={onDelete} />
          </li>
        ))}
      </ul>
    </>
  )
}

/** Une échéance dépassée est signalée, sauf si la tâche est déjà terminée. */
function DueDate({ task }: { task: Task }) {
  if (!task.dueDate) {
    return <span className="text-muted-foreground text-sm">—</span>
  }
  const late = task.status !== 'DONE' && isOverdue(task.dueDate)
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-sm', late ? 'text-destructive font-medium' : 'text-muted-foreground')}
    >
      <CalendarClockIcon className="size-3.5" />
      {formatDateTime(task.dueDate)}
      {late && <span className="sr-only">(en retard)</span>}
    </span>
  )
}
