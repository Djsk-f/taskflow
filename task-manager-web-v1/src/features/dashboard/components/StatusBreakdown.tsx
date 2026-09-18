import { TASK_STATUS_META } from '@/features/tasks/taskMeta'
import { TASK_STATUSES, type TaskStatus } from '@/features/tasks/types'
import { cn } from '@/shared/lib/utils'
import { useState } from 'react'

const percent = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100))

/**
 * Répartition par statut : une barre empilée (part d'un tout) et sa légende chiffrée, qui
 * tient lieu de tableau. Les couleurs sont celles des statuts, validées pour le daltonisme ;
 * l'identité passe aussi par le libellé, jamais par la couleur seule.
 */
export function StatusBreakdown({ byStatus, total }: { byStatus: Record<TaskStatus, number>; total: number }) {
  const [active, setActive] = useState<TaskStatus | null>(null)
  const segments = TASK_STATUSES.filter((status) => byStatus[status] > 0)

  return (
    <section className="bg-card shadow-card rounded-card border p-5">
      <h2 className="font-semibold">Répartition par statut</h2>
      <p className="text-muted-foreground text-sm">
        {total} tâche{total > 1 ? 's' : ''} au total
      </p>

      <div className="relative mt-5">
        {active && (
          <div
            role="status"
            className="bg-popover text-popover-foreground absolute -top-10 left-1/2 -translate-x-1/2 rounded-md border px-2.5 py-1 text-xs whitespace-nowrap shadow-md"
          >
            <span className="font-medium">{TASK_STATUS_META[active].label}</span> : {byStatus[active]} (
            {percent(byStatus[active], total)} %)
          </div>
        )}
        <div className="flex h-5 w-full gap-0.5" onMouseLeave={() => setActive(null)}>
          {segments.map((status, index) => (
            <div
              key={status}
              tabIndex={0}
              role="img"
              aria-label={`${TASK_STATUS_META[status].label} : ${byStatus[status]} tâches, ${percent(byStatus[status], total)} %`}
              onMouseEnter={() => setActive(status)}
              onFocus={() => setActive(status)}
              onBlur={() => setActive(null)}
              style={{ flexGrow: byStatus[status] }}
              className={cn(
                'focus-visible:ring-ring/50 min-w-1 outline-none focus-visible:ring-[3px]',
                TASK_STATUS_META[status].dotClassName,
                index === 0 && 'rounded-l-[4px]',
                index === segments.length - 1 && 'rounded-r-[4px]',
                active !== null && active !== status && 'opacity-40',
              )}
            />
          ))}
          {segments.length === 0 && <div className="bg-muted h-full w-full rounded-[4px]" />}
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {TASK_STATUSES.map((status) => (
          <li key={status} className="flex items-start gap-2">
            <span className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', TASK_STATUS_META[status].dotClassName)} />
            <div>
              <p className="text-muted-foreground text-sm">{TASK_STATUS_META[status].label}</p>
              <p className="font-semibold">
                {byStatus[status]}
                <span className="text-muted-foreground ml-1.5 text-xs font-normal">{percent(byStatus[status], total)} %</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
