import { PriorityBars } from '@/features/dashboard/components/PriorityBars'
import { StatTile } from '@/features/dashboard/components/StatTile'
import { StatusBreakdown } from '@/features/dashboard/components/StatusBreakdown'
import { UpcomingDeadlines } from '@/features/dashboard/components/UpcomingDeadlines'
import { useTaskStats } from '@/features/tasks/hooks/useTaskInsights'
import { useTimeEntries } from '@/features/timesheets/hooks/useTimeEntries'
import { formatDuration } from '@/shared/lib/duration'
import { addDays, startOfWeek, toIsoDate } from '@/shared/lib/week'
import { extractApiError } from '@/shared/api/extractApiError'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { AppShell } from '@/shared/components/layout/AppShell'
import { Skeleton } from '@/shared/ui/skeleton'
import { AlarmClockIcon, CalendarRangeIcon, CircleCheckBigIcon, ClockIcon, LayoutGridIcon, ListChecksIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/** Tableau de bord (bonus B-03) : l'entrée « Dashboard » de la capture. */
export function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useTaskStats()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const monday = startOfWeek(new Date())
  const { data: weekEntries } = useTimeEntries(toIsoDate(monday), toIsoDate(addDays(monday, 6)))
  const weekMinutes = (weekEntries ?? []).reduce((sum, entry) => sum + entry.durationMinutes, 0)

  return (
    <AppShell title={t('dashboard.title')}>
      {isPending && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && <ErrorState message={extractApiError(error).message} onRetry={() => refetch()} />}

      {data && data.total === 0 && (
        <section className="bg-card shadow-card rounded-card border">
          <EmptyState
            icon={LayoutGridIcon}
            title={t('dashboard.empty.title')}
            description={t('dashboard.empty.description')}
            action={{ label: t('dashboard.empty.action'), onClick: () => navigate('/tasks') }}
          />
        </section>
      )}

      {data && data.total > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
            <StatTile
              label={t('dashboard.tiles.total')}
              value={data.total}
              hint={t('dashboard.tiles.totalHint')}
              icon={ListChecksIcon}
              to="/tasks?view=table"
            />
            <StatTile
              label={t('dashboard.tiles.done')}
              value={data.byStatus.DONE}
              hint={t('dashboard.tiles.doneHint', { percent: Math.round((data.byStatus.DONE / data.total) * 100) })}
              icon={CircleCheckBigIcon}
              to="/tasks?view=table&status=DONE"
            />
            <StatTile
              label={t('dashboard.tiles.overdue')}
              value={data.overdue}
              hint={data.overdue > 0 ? t('dashboard.tiles.overdueHint') : t('dashboard.tiles.noOverdue')}
              icon={AlarmClockIcon}
              alert={data.overdue > 0}
              to="/tasks?view=table&due=OVERDUE"
            />
            <StatTile
              label={t('dashboard.tiles.week')}
              value={data.dueThisWeek}
              hint={t('dashboard.tiles.weekHint')}
              icon={CalendarRangeIcon}
              to="/tasks?view=table&due=THIS_WEEK"
            />
            <StatTile
              label={t('dashboard.tiles.timeWeek')}
              value={formatDuration(weekMinutes)}
              hint={t('dashboard.tiles.timeWeekHint')}
              icon={ClockIcon}
              to="/timesheets"
              className="col-span-2 xl:col-span-1"
            />
          </div>

          <StatusBreakdown byStatus={data.byStatus} total={data.total} />

          <div className="grid gap-6 lg:grid-cols-2">
            <PriorityBars openByPriority={data.openByPriority} />
            <UpcomingDeadlines />
          </div>
        </div>
      )}
    </AppShell>
  )
}
