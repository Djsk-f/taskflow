import { TaskPriorityBadge, TaskStatusBadge } from '@/features/tasks/components/TaskBadges'
import { TaskDueDate } from '@/features/tasks/components/TaskDueDate'
import { TaskTimeSpent } from '@/features/tasks/components/TaskTimeSpent'
import { TaskRowActions, type TaskActionHandlers } from '@/features/tasks/components/TaskRowActions'
import type { Task } from '@/features/tasks/types'

/** Vue « Liste » : tâches empilées. Sert aussi de tableau sous 768 px (EX-13). */
export function TaskList({ tasks, ...actions }: { tasks: Task[] } & TaskActionHandlers) {
  return (
    <ul className="divide-y">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-start gap-3 px-4 py-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium [overflow-wrap:anywhere]">{task.title}</p>
            {task.description && (
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm [overflow-wrap:anywhere]">
                {task.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
              <TaskDueDate task={task} compact />
              <TaskTimeSpent task={task} />
            </div>
          </div>
          <TaskRowActions task={task} {...actions} />
        </li>
      ))}
    </ul>
  )
}
