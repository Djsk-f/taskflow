import { priorityOptions, statusOptions } from '@/features/tasks/taskMeta'
import type { TaskPriority, TaskStatus } from '@/features/tasks/types'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { SearchIcon } from 'lucide-react'

const ALL = 'ALL'

type TaskFiltersBarProps = {
  searchDraft: string
  onSearchDraftChange: (value: string) => void
  status: TaskStatus | null
  onStatusChange: (value: TaskStatus | null) => void
  priority: TaskPriority | null
  onPriorityChange: (value: TaskPriority | null) => void
  /** Masqué en vue Kanban : les colonnes sont déjà les statuts. */
  showStatus?: boolean
}

/**
 * Recherche et filtres (EX-08, EX-09, EX-10). Les listes de choix sont construites depuis
 * taskMeta : aucun libellé de statut n'est réécrit ici.
 */
export function TaskFiltersBar({
  searchDraft,
  onSearchDraftChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  showStatus = true,
}: TaskFiltersBarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative sm:w-64">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={searchDraft}
          onChange={(event) => onSearchDraftChange(event.target.value)}
          placeholder="Rechercher une tâche…"
          aria-label="Rechercher une tâche (titre ou description)"
          className="bg-card pl-9"
        />
      </div>

      <div className="flex gap-2">
        {showStatus && (
          <Select
            value={status ?? ALL}
            onValueChange={(value) => onStatusChange(value === ALL ? null : (value as TaskStatus))}
          >
            <SelectTrigger className="bg-card w-full sm:w-40" aria-label="Filtrer par statut">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les statuts</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={priority ?? ALL}
          onValueChange={(value) => onPriorityChange(value === ALL ? null : (value as TaskPriority))}
        >
          <SelectTrigger className="bg-card w-full sm:w-44" aria-label="Filtrer par priorité">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes les priorités</SelectItem>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
