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

/** Tableau de bord (bonus B-03) : l'entrée « Dashboard » de la capture. */
export function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useTaskStats()
  const navigate = useNavigate()

  return (
    <AppShell title="Tableau de bord">
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
            title="Rien à analyser pour l'instant"
            description="Créez vos premières tâches : leur avancement apparaîtra ici."
            action={{ label: 'Aller aux tâches', onClick: () => navigate('/tasks') }}
          />
        </section>
      )}

      {data && data.total > 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Tâches" value={data.total} hint="Tous statuts confondus" icon={ListChecksIcon} />
            <StatTile
              label="Terminées"
              value={data.byStatus.DONE}
              hint={`${Math.round((data.byStatus.DONE / data.total) * 100)} % du total`}
              icon={CircleCheckBigIcon}
            />
            <StatTile
              label="En retard"
              value={data.overdue}
              hint={data.overdue > 0 ? 'Échéance dépassée, non terminées' : 'Aucun retard'}
              icon={AlarmClockIcon}
              alert={data.overdue > 0}
            />
            <StatTile
              label="À rendre cette semaine"
              value={data.dueThisWeek}
              hint="Dans les 7 prochains jours"
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
