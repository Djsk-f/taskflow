import { PriorityBars } from '@/features/dashboard/components/PriorityBars'
import { StatTile } from '@/features/dashboard/components/StatTile'
import { StatusBreakdown } from '@/features/dashboard/components/StatusBreakdown'
import { UpcomingDeadlines } from '@/features/dashboard/components/UpcomingDeadlines'
import { useTaskStats } from '@/features/tasks/hooks/useTaskInsights'
import { extractApiError } from '@/shared/api/extractApiError'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { AppShell } from '@/shared/components/layout/AppShell'
import { Skeleton } from '@/shared/ui/skeleton'
import { AlarmClockIcon, CalendarRangeIcon, CircleCheckBigIcon, LayoutGridIcon, ListChecksIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/** Tableau de bord (bonus B-03) : l'entrée « Dashboard » de la capture. */
export function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useTaskStats()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <AppShell title={t('dashboard.title')}>
      {isPending && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label={t('dashboard.tiles.total')}
              value={data.total}
              hint={t('dashboard.tiles.totalHint')}
              icon={ListChecksIcon}
            />
            <StatTile
              label={t('dashboard.tiles.done')}
              value={data.byStatus.DONE}
              hint={t('dashboard.tiles.doneHint', { percent: Math.round((data.byStatus.DONE / data.total) * 100) })}
              icon={CircleCheckBigIcon}
            />
            <StatTile
              label={t('dashboard.tiles.overdue')}
              value={data.overdue}
              hint={data.overdue > 0 ? t('dashboard.tiles.overdueHint') : t('dashboard.tiles.noOverdue')}
              icon={AlarmClockIcon}
              alert={data.overdue > 0}
            />
            <StatTile
              label={t('dashboard.tiles.week')}
              value={data.dueThisWeek}
              hint={t('dashboard.tiles.weekHint')}
              icon={CalendarRangeIcon}
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
