import { isSameSort } from '@/features/tasks/taskFilters'
import type { TaskSort } from '@/features/tasks/types'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { ArrowDownWideNarrowIcon, ArrowUpNarrowWideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Tris proposés dans le menu ; les en-têtes de la grille permettent tous les autres. */
const PRESETS = [
  { key: 'dueSoon', sort: { field: 'dueDate', direction: 'asc' } },
  { key: 'priorityHigh', sort: { field: 'priority', direction: 'desc' } },
  { key: 'newest', sort: { field: 'createdAt', direction: 'desc' } },
  { key: 'title', sort: { field: 'title', direction: 'asc' } },
] as const satisfies readonly { key: string; sort: TaskSort }[]

/**
 * Menu « Trier » : seul moyen de trier en Kanban, en liste et sur mobile, où il n'y a
 * pas d'en-têtes de colonnes. Un tri choisi depuis la grille reste affiché tel quel.
 */
export function TaskSortMenu({ sort, onChange }: { sort: TaskSort; onChange: (sort: TaskSort) => void }) {
  const { t } = useTranslation()
  const preset = PRESETS.find((candidate) => isSameSort(candidate.sort, sort))
  const current = preset
    ? t(`tasks.sort.presets.${preset.key}`)
    : t('tasks.sort.current', {
        field: t(`tasks.sort.fields.${sort.field}`),
        direction: t(`tasks.sort.directions.${sort.direction}`),
      })
  const Icon = sort.direction === 'asc' ? ArrowUpNarrowWideIcon : ArrowDownWideNarrowIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-card shrink-0" aria-label={t('tasks.sort.label', { current })}>
          <Icon className="size-4" />
          <span className="hidden max-w-48 truncate sm:inline">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuRadioGroup
          value={preset?.key ?? ''}
          onValueChange={(key) => {
            const chosen = PRESETS.find((candidate) => candidate.key === key)
            if (chosen) {
              onChange(chosen.sort)
            }
          }}
        >
          {PRESETS.map(({ key }) => (
            <DropdownMenuRadioItem key={key} value={key}>
              {t(`tasks.sort.presets.${key}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
