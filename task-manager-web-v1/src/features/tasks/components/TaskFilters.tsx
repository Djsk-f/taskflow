import { TASK_PRIORITY_META, TASK_STATUS_META } from '@/features/tasks/taskMeta'
import { TaskSortMenu } from '@/features/tasks/components/TaskSortMenu'
import {
  TASK_DUE_FILTERS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskDueFilter,
  type TaskPriority,
  type TaskSort,
  type TaskStatus,
} from '@/features/tasks/types'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { AlarmClockIcon, CalendarRangeIcon, SearchIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type TaskFiltersBarProps = {
  searchDraft: string
  onSearchDraftChange: (value: string) => void
  status: TaskStatus | null
  onStatusChange: (value: TaskStatus | null) => void
  priority: TaskPriority | null
  onPriorityChange: (value: TaskPriority | null) => void
  due: TaskDueFilter | null
  onDueChange: (value: TaskDueFilter | null) => void
  sort: TaskSort
  onSortChange: (value: TaskSort) => void
  /** Retire tous les filtres en une seule navigation (deux appels successifs s'écraseraient). */
  onClearFilters: () => void
  /** Masqué en vue Kanban : les colonnes sont déjà les statuts. */
  showStatus?: boolean
}

/** Icônes des filtres d'échéance, reprises des tuiles du tableau de bord. */
const DUE_ICONS = { OVERDUE: AlarmClockIcon, THIS_WEEK: CalendarRangeIcon } as const satisfies Record<TaskDueFilter, unknown>

/**
 * Recherche, filtres et tri (EX-08 à EX-10) : un champ de recherche, un bouton « Filtres »
 * ouvrant des pastilles (priorité, statut, échéance), le menu « Trier », et les filtres
 * actifs en étiquettes supprimables. Libellés, icônes et couleurs viennent de taskMeta.
 */
export function TaskFiltersBar({
  searchDraft,
  onSearchDraftChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  due,
  onDueChange,
  sort,
  onSortChange,
  onClearFilters,
  showStatus = true,
}: TaskFiltersBarProps) {
  const { t } = useTranslation()
  const visibleStatus = showStatus ? status : null
  const activeCount = (priority ? 1 : 0) + (visibleStatus ? 1 : 0) + (due ? 1 : 0)

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1 sm:max-w-sm">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={searchDraft}
            onChange={(event) => onSearchDraftChange(event.target.value)}
            placeholder={t('tasks.search.placeholder')}
            aria-label={t('tasks.search.label')}
            className="bg-card pl-9"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn('bg-card shrink-0', activeCount > 0 && 'border-primary/50 text-primary')}
              aria-label={activeCount > 0 ? t('tasks.filters.buttonActive', { count: activeCount }) : t('tasks.filters.button')}
            >
              <SlidersHorizontalIcon className="size-4" />
              <span className="hidden sm:inline">{t('tasks.filters.button')}</span>
              {activeCount > 0 && (
                <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full text-xs font-semibold">
                  {activeCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-4">
            <ChipGroup label={t('tasks.filters.priority')}>
              {TASK_PRIORITIES.map((value) => {
                const meta = TASK_PRIORITY_META[value]
                return (
                  <Chip key={value} selected={priority === value} onClick={() => onPriorityChange(priority === value ? null : value)}>
                    <meta.icon className="size-3.5" />
                    {t(meta.labelKey)}
                  </Chip>
                )
              })}
            </ChipGroup>

            {showStatus && (
              <ChipGroup label={t('tasks.filters.status')}>
                {TASK_STATUSES.map((value) => {
                  const meta = TASK_STATUS_META[value]
                  return (
                    <Chip key={value} selected={status === value} onClick={() => onStatusChange(status === value ? null : value)}>
                      <span className={cn('size-2 rounded-full', meta.dotClassName)} />
                      {t(meta.labelKey)}
                    </Chip>
                  )
                })}
              </ChipGroup>
            )}

            <ChipGroup label={t('tasks.filters.due')}>
              {TASK_DUE_FILTERS.map((value) => {
                const Icon = DUE_ICONS[value]
                return (
                  <Chip key={value} selected={due === value} onClick={() => onDueChange(due === value ? null : value)}>
                    <Icon className="size-3.5" />
                    {t(`tasks.filters.dueValues.${value}`)}
                  </Chip>
                )
              })}
            </ChipGroup>

            <div className="flex justify-end border-t pt-3">
              <Button variant="ghost" size="sm" onClick={onClearFilters} disabled={activeCount === 0}>
                {t('tasks.filters.clear')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <TaskSortMenu sort={sort} onChange={onSortChange} />
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {priority && (
            <ActiveFilter
              label={t('tasks.filters.chip', { name: t('tasks.filters.priority'), value: t(TASK_PRIORITY_META[priority].labelKey) })}
              onRemove={() => onPriorityChange(null)}
            />
          )}
          {visibleStatus && (
            <ActiveFilter
              label={t('tasks.filters.chip', { name: t('tasks.filters.status'), value: t(TASK_STATUS_META[visibleStatus].labelKey) })}
              onRemove={() => onStatusChange(null)}
            />
          )}
          {due && (
            <ActiveFilter
              label={t('tasks.filters.chip', { name: t('tasks.filters.due'), value: t(`tasks.filters.dueValues.${due}`) })}
              onRemove={() => onDueChange(null)}
            />
          )}
          <button
            type="button"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground min-h-10 px-2 text-sm underline-offset-4 hover:underline"
          >
            {t('tasks.filters.clearAll')}
          </button>
        </div>
      )}
    </div>
  )
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

/** Pastille à bascule : un second clic retire le filtre. */
function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring/50 inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-[3px]',
        selected
          ? 'border-primary bg-secondary text-primary font-medium'
          : 'bg-card text-foreground hover:bg-accent',
      )}
    >
      {children}
    </button>
  )
}

function ActiveFilter({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { t } = useTranslation()
  return (
    <span className="bg-secondary text-secondary-foreground inline-flex min-h-10 items-center gap-0.5 rounded-full pl-3.5 text-sm font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('tasks.filters.remove', { label })}
        className="hover:bg-primary/15 focus-visible:ring-ring/50 flex size-10 items-center justify-center rounded-full outline-none focus-visible:ring-[3px]"
      >
        <XIcon className="size-3.5" />
      </button>
    </span>
  )
}
