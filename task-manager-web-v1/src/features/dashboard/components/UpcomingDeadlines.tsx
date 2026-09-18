import { TaskStatusBadge } from '@/features/tasks/components/TaskBadges'
import { TaskDueDate } from '@/features/tasks/components/TaskDueDate'
import { useDueTasks } from '@/features/tasks/hooks/useTaskInsights'
import { Skeleton } from '@/shared/ui/skeleton'
import { CalendarCheckIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

const WEEK_HOURS = 7 * 24

/** Échéances en retard ou dans les 7 prochains jours ; chaque ligne mène à la tâche. */
export function UpcomingDeadlines() {
  const { data, isPending, isError } = useDueTasks(WEEK_HOURS)

  return (
    <section className="bg-card shadow-card rounded-card border">
      <div className="p-5 pb-3">
        <h2 className="font-semibold">Échéances de la semaine</h2>
        <p className="text-muted-foreground text-sm">En retard ou à rendre dans les 7 prochains jours</p>
      </div>

      {isPending && (
        <div className="space-y-2 px-5 pb-5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && <p className="text-destructive px-5 pb-5 text-sm">Échéances indisponibles.</p>}

      {data && data.length === 0 && (
        <p className="text-muted-foreground flex items-center gap-2 px-5 pb-5 text-sm">
          <CalendarCheckIcon className="text-success size-4" />
          Aucune échéance cette semaine.
        </p>
      )}

      {data && data.length > 0 && (
        <ul className="divide-y border-t">
          {data.map((task) => (
            <li key={task.id}>
              <Link
                to={`/tasks?search=${encodeURIComponent(task.title)}`}
                className="hover:bg-accent focus-visible:bg-accent flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 outline-none"
              >
                <span className="min-w-0 flex-1 text-sm font-medium [overflow-wrap:anywhere]">{task.title}</span>
                <TaskDueDate task={task} compact />
                <TaskStatusBadge status={task.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
