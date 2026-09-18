import { TASK_PRIORITY_META } from '@/features/tasks/taskMeta'
import { TASK_PRIORITIES, type TaskPriority } from '@/features/tasks/types'
import { useTranslation } from 'react-i18next'

/**
 * Tâches ouvertes par priorité : comparaison de quantités, donc barres d'une seule teinte ;
 * chaque barre est identifiée par son libellé, la valeur est écrite au bout.
 */
export function PriorityBars({ openByPriority }: { openByPriority: Record<TaskPriority, number> }) {
  const { t } = useTranslation()
  const max = Math.max(1, ...TASK_PRIORITIES.map((priority) => openByPriority[priority]))
  const open = TASK_PRIORITIES.reduce((sum, priority) => sum + openByPriority[priority], 0)
  const ordered = [...TASK_PRIORITIES].reverse()

  return (
    <section className="bg-card shadow-card rounded-card border p-5">
      <h2 className="font-semibold">{t('dashboard.priority.title')}</h2>
      <p className="text-muted-foreground text-sm">
        {t('dashboard.priority.open', { count: open })}
      </p>

      <dl className="mt-5 space-y-4">
        {ordered.map((priority) => {
          const meta = TASK_PRIORITY_META[priority]
          const value = openByPriority[priority]
          return (
            <div key={priority} className="grid grid-cols-[5.5rem_1fr] items-center gap-3">
              <dt className="flex items-center gap-1.5 text-sm">
                <meta.icon className="text-muted-foreground size-3.5" />
                {t(meta.labelKey)}
              </dt>
              <dd className="flex items-center gap-2">
                <div
                  className="bg-primary h-3 rounded-r-[4px]"
                  style={{ width: `${(value / max) * 100}%`, minWidth: value > 0 ? '0.25rem' : 0 }}
                  role="img"
                  aria-label={`${t(meta.labelKey)} : ${value}`}
                />
                <span className="text-muted-foreground text-sm tabular-nums">{value}</span>
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
