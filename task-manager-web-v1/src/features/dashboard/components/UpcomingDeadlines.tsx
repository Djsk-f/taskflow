import { TaskStatusBadge } from '@/features/tasks/components/TaskBadges'
import { TaskDueDate } from '@/features/tasks/components/TaskDueDate'
import { useDueTasks } from '@/features/tasks/hooks/useTaskInsights'
import { CompactPager } from '@/shared/components/pagination/CompactPager'
import { Skeleton } from '@/shared/ui/skeleton'
import { CalendarCheckIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const WEEK_HOURS = 7 * 24
/** Lignes par page : le bloc garde une hauteur stable à côté des priorités. */
const PAGE_SIZE = 5

/** Échéances en retard ou dans les 7 prochains jours ; chaque ligne mène à la tâche. */
export function UpcomingDeadlines() {
  const { data, isPending, isError } = useDueTasks(WEEK_HOURS)
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil((data?.length ?? 0) / PAGE_SIZE)
  // Une échéance traitée peut réduire le nombre de pages : on reste sur une page existante.
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0))
  const visible = (data ?? []).slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  return (
    <section className="bg-card shadow-card rounded-card border">
      <div className="flex items-start gap-2 p-5 pb-3">
        <div className="flex-1">
          <h2 className="font-semibold">{t('dashboard.deadlines.title')}</h2>
          <p className="text-muted-foreground text-sm">{t('dashboard.deadlines.subtitle')}</p>
        </div>
        <CompactPager page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {isPending && (
        <div className="space-y-2 px-5 pb-5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && <p className="text-destructive px-5 pb-5 text-sm">{t('dashboard.deadlines.unavailable')}</p>}

      {data && data.length === 0 && (
        <p className="text-muted-foreground flex items-center gap-2 px-5 pb-5 text-sm">
          <CalendarCheckIcon className="text-success size-4" />
          {t('dashboard.deadlines.empty')}
        </p>
      )}

      {data && data.length > 0 && (
        <ul className="divide-y border-t">
          {visible.map((task) => (
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
