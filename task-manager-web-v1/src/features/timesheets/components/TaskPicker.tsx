import { taskApi } from '@/features/tasks/api/taskApi'
import { TASKS_QUERY_KEY } from '@/features/tasks/hooks/useTasks'
import { TASK_STATUS_META } from '@/features/tasks/taskMeta'
import type { Task } from '@/features/tasks/types'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Loader2Icon, PlusIcon } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Recherche d'une tâche à ajouter à la feuille (modèle « combobox » ARIA) : la recherche
 * se fait côté serveur, 10 suggestions au plus — la liste reste courte quel que soit le
 * nombre de tâches. Flèches pour naviguer, Entrée pour choisir, Échap pour fermer.
 */
export function TaskPicker({ exclude, onPick }: { exclude: number[]; onPick: (task: Task) => void }) {
  const { t } = useTranslation()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const search = useDebouncedValue(query.trim(), 250)

  const { data, isFetching } = useQuery({
    queryKey: [TASKS_QUERY_KEY, 'suggest', search],
    queryFn: () => taskApi.suggest(search),
    enabled: open,
    placeholderData: keepPreviousData,
  })
  const suggestions = (data ?? []).filter((task) => !exclude.includes(task.id))

  const pick = (task: Task) => {
    onPick(task)
    setQuery('')
    setOpen(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((index) => Math.min(index + 1, suggestions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && open && suggestions[active]) {
      event.preventDefault()
      pick(suggestions[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative w-full sm:w-96">
      <PlusIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && suggestions[active] ? `${listId}-${suggestions[active].id}` : undefined}
        aria-label={t('timesheets.addRow')}
        placeholder={t('timesheets.addRowPlaceholder')}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        // Laisse le temps au clic sur une suggestion d'aboutir avant de fermer.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        className="bg-card pl-9"
      />
      {isFetching && (
        <Loader2Icon className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
      )}

      {open && (
        <div className="bg-popover absolute bottom-full z-30 mb-1 w-full rounded-lg border p-1 shadow-md">
          <p className="sr-only" aria-live="polite">
            {t('timesheets.addRowCount', { count: suggestions.length })}
          </p>
          {suggestions.length === 0 && !isFetching ? (
            <p className="text-muted-foreground px-3 py-2 text-sm">{t('timesheets.addRowNoResult')}</p>
          ) : (
            <ul id={listId} role="listbox" aria-label={t('timesheets.addRow')} className="max-h-72 overflow-y-auto">
              {suggestions.map((task, index) => (
                <li
                  key={task.id}
                  id={`${listId}-${task.id}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(task)}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    'flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-3 text-sm',
                    index === active && 'bg-accent text-accent-foreground',
                  )}
                >
                  <span className={cn('size-2 shrink-0 rounded-full', TASK_STATUS_META[task.status].dotClassName)} />
                  <span className="truncate">{task.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
