import { DeleteTaskDialog } from '@/features/tasks/components/DeleteTaskDialog'
import { TaskFiltersBar } from '@/features/tasks/components/TaskFilters'
import { TaskFormDialog } from '@/features/tasks/components/TaskFormDialog'
import { TaskTable } from '@/features/tasks/components/TaskTable'
import { TaskTableSkeleton } from '@/features/tasks/components/TaskTableSkeleton'
import { TasksPagination } from '@/features/tasks/components/TasksPagination'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { hasActiveFilters, readTaskFilters, writeTaskFilters } from '@/features/tasks/taskFilters'
import type { Task, TaskFilters, TaskPriority, TaskStatus } from '@/features/tasks/types'
import { extractApiError } from '@/shared/api/extractApiError'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { AppShell } from '@/shared/components/layout/AppShell'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { ListChecksIcon, PlusIcon, SearchXIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readTaskFilters(searchParams)

  const [searchDraft, setSearchDraft] = useState(filters.search)
  const debouncedSearch = useDebouncedValue(searchDraft, 300)

  const [formOpen, setFormOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  const { data, isPending, isError, error, refetch } = useTasks(filters)

  const applyFilters = (changes: Partial<TaskFilters>) => {
    // Toute modification de filtre ramène à la première page : sinon on resterait sur une
    // page 3 qui n'existe plus pour le nouveau jeu de résultats.
    const next = { ...filters, ...changes }
    setSearchParams(writeTaskFilters({ ...next, page: changes.page ?? 0 }), { replace: true })
  }

  // La saisie est locale, l'URL ne reçoit que la valeur stabilisée (EX-08).
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      applyFilters({ search: debouncedSearch })
    }
  }, [debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  const openCreateForm = () => {
    setTaskToEdit(undefined)
    setFormOpen(true)
  }

  const openEditForm = (task: Task) => {
    setTaskToEdit(task)
    setFormOpen(true)
  }

  return (
    <AppShell
      title="Tâches"
      action={
        <Button onClick={openCreateForm}>
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">Créer une tâche</span>
        </Button>
      }
    >
      <ViewTabs />

      <div className="mt-4 space-y-4">
        <TaskFiltersBar
          searchDraft={searchDraft}
          onSearchDraftChange={setSearchDraft}
          status={filters.status}
          onStatusChange={(status: TaskStatus | null) => applyFilters({ status })}
          priority={filters.priority}
          onPriorityChange={(priority: TaskPriority | null) => applyFilters({ priority })}
        />

        <section className="bg-card shadow-card rounded-card overflow-hidden border">
          {isPending && <TaskTableSkeleton />}

          {isError && <ErrorState message={extractApiError(error).message} onRetry={() => refetch()} />}

          {data && data.content.length === 0 && !hasActiveFilters(filters) && (
            <EmptyState
              icon={ListChecksIcon}
              title="Aucune tâche pour l'instant"
              description="Créez votre première tâche pour commencer à organiser votre travail."
              action={{ label: 'Créer une tâche', onClick: openCreateForm }}
            />
          )}

          {data && data.content.length === 0 && hasActiveFilters(filters) && (
            <EmptyState
              icon={SearchXIcon}
              title="Aucun résultat"
              description="Aucune tâche ne correspond à cette recherche ou à ces filtres."
              action={{
                label: 'Réinitialiser les filtres',
                onClick: () => {
                  setSearchDraft('')
                  setSearchParams(new URLSearchParams(), { replace: true })
                },
              }}
            />
          )}

          {data && data.content.length > 0 && (
            <>
              <TaskTable tasks={data.content} onEdit={openEditForm} onDelete={setTaskToDelete} />
              <TasksPagination
                page={data.page}
                size={data.size}
                totalElements={data.totalElements}
                totalPages={data.totalPages}
                first={data.first}
                last={data.last}
                onPageChange={(page) => applyFilters({ page })}
              />
            </>
          )}
        </section>
      </div>

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={taskToEdit} />
      <DeleteTaskDialog task={taskToDelete} onClose={() => setTaskToDelete(null)} />
    </AppShell>
  )
}

/**
 * Onglets de la capture de référence. « Kanban » est visible mais explicitement désactivé :
 * c'est le bonus B-01, et la charte interdit de présenter un onglet qui ne répond pas
 * (INV-01, INV-03).
 */
function ViewTabs() {
  return (
    <div className="flex items-center gap-1 border-b" role="tablist">
      <span
        role="tab"
        aria-selected="true"
        className={cn('border-primary text-primary -mb-px border-b-2 px-3 py-2.5 text-sm font-medium')}
      >
        Tableau
      </span>
      <span
        role="tab"
        aria-selected="false"
        aria-disabled="true"
        className="text-muted-foreground cursor-not-allowed px-3 py-2.5 text-sm opacity-60"
        title="Vue Kanban : prévue après le socle"
      >
        Kanban <span className="text-xs">(bientôt)</span>
      </span>
    </div>
  )
}
