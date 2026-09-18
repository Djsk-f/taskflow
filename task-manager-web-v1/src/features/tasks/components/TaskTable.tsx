import { TaskPriorityBadge, TaskStatusBadge } from '@/features/tasks/components/TaskBadges'
import { TaskDueDate } from '@/features/tasks/components/TaskDueDate'
import { TaskList } from '@/features/tasks/components/TaskList'
import { TaskRowActions, type TaskActionHandlers } from '@/features/tasks/components/TaskRowActions'
import type { Task } from '@/features/tasks/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

/**
 * Vue « Tableau » à partir de 768 px, liste empilée en dessous (EX-13) : les deux rendus
 * partagent badges, échéance et actions, seule la mise en page change.
 */
export function TaskTable({ tasks, ...actions }: { tasks: Task[] } & TaskActionHandlers) {
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
                  <TaskRowActions task={task} {...actions} />
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
