import { DeleteTaskDialog } from '@/features/tasks/components/DeleteTaskDialog'
import { KanbanBoard } from '@/features/tasks/components/KanbanBoard'
import { TaskFiltersBar } from '@/features/tasks/components/TaskFilters'
import { TaskFormDialog } from '@/features/tasks/components/TaskFormDialog'
import { TaskList } from '@/features/tasks/components/TaskList'
import type { TaskActionHandlers } from '@/features/tasks/components/TaskRowActions'
import { TaskTable } from '@/features/tasks/components/TaskTable'
import { TaskTableSkeleton } from '@/features/tasks/components/TaskTableSkeleton'
import { TasksPagination } from '@/features/tasks/components/TasksPagination'
import { TaskViewTabs } from '@/features/tasks/components/TaskViewTabs'
import { useMoveTask } from '@/features/tasks/hooks/useMoveTask'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import {
  hasActiveFilters,
  readTaskFilters,
  readTaskView,
  withTaskView,
  writeTaskFilters,
} from '@/features/tasks/taskFilters'
import type { Task, TaskFilters, TaskStatus, TaskView } from '@/features/tasks/types'
import { extractApiError } from '@/shared/api/extractApiError'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { AppShell } from '@/shared/components/layout/AppShell'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { Button } from '@/shared/ui/button'
import { ListChecksIcon, PlusIcon, SearchXIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readTaskFilters(searchParams)
  const view = readTaskView(searchParams)

  const [searchDraft, setSearchDraft] = useState(filters.search)
  const debouncedSearch = useDebouncedValue(searchDraft, 300)

  // L'URL peut changer sans passer par le champ (cloche, retour arrière) : le champ suit.
  // Ajustement pendant le rendu plutôt qu'un effet, comme le recommande React.
  const [syncedSearch, setSyncedSearch] = useState(filters.search)
  if (filters.search !== syncedSearch) {
    setSyncedSearch(filters.search)
    setSearchDraft(filters.search)
  }

  const [formOpen, setFormOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined)
  const [createStatus, setCreateStatus] = useState<TaskStatus>('TODO')
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const { moveTask, pendingMoves } = useMoveTask()

  /** Filtres et vue vivent dans l'URL ; un changement de filtre ramène en page 1. */
  const navigate = (nextFilters: TaskFilters, nextView: TaskView = view) => {
    setSearchParams(withTaskView(writeTaskFilters(nextFilters), nextView), { replace: true })
  }
  const applyFilters = (changes: Partial<TaskFilters>) => {
    navigate({ ...filters, ...changes, page: changes.page ?? 0 })
  }

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      applyFilters({ search: debouncedSearch })
    }
  }, [debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  const changeView = (nextView: TaskView) => {
    // En Kanban les colonnes sont les statuts : le filtre de statut n'y a pas de sens.
    navigate({ ...filters, status: nextView === 'kanban' ? null : filters.status, page: 0 }, nextView)
  }

  const openCreateForm = (status: TaskStatus = 'TODO') => {
    setTaskToEdit(undefined)
    setCreateStatus(status)
    setFormOpen(true)
  }

  const actions: TaskActionHandlers = {
    onEdit: (task) => {
      setTaskToEdit(task)
      setFormOpen(true)
    },
    onDelete: setTaskToDelete,
    onMove: moveTask,
  }

  const resetFilters = () => {
    setSearchDraft('')
    navigate({ ...filters, search: '', status: null, priority: null, page: 0 })
  }

  return (
    <AppShell
      title="Tâches"
      action={
        <Button onClick={() => openCreateForm()}>
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">Créer une tâche</span>
        </Button>
      }
      toolbar={
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TaskViewTabs view={view} onChange={changeView} />
          <TaskFiltersBar
            searchDraft={searchDraft}
            onSearchDraftChange={setSearchDraft}
            status={filters.status}
            onStatusChange={(status) => applyFilters({ status })}
            priority={filters.priority}
            onPriorityChange={(priority) => applyFilters({ priority })}
            showStatus={view !== 'kanban'}
          />
        </div>
      }
    >
      {view === 'kanban' ? (
        <KanbanBoard
          search={filters.search}
          priority={filters.priority}
          pendingMoves={pendingMoves}
          onCreate={openCreateForm}
          onShowInTable={(status) => navigate({ ...filters, status, page: 0 }, 'table')}
          {...actions}
        />
      ) : (
        <PaginatedTasks
          view={view}
          filters={filters}
          actions={actions}
          onPageChange={(page) => applyFilters({ page })}
          onCreate={() => openCreateForm()}
          onResetFilters={resetFilters}
        />
      )}

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={taskToEdit} defaultStatus={createStatus} />
      <DeleteTaskDialog task={taskToDelete} onClose={() => setTaskToDelete(null)} />
    </AppShell>
  )
}

type PaginatedTasksProps = {
  view: Exclude<TaskView, 'kanban'>
  filters: TaskFilters
  actions: TaskActionHandlers
  onPageChange: (page: number) => void
  onCreate: () => void
  onResetFilters: () => void
}

/** Vues Tableau et Liste : mêmes données paginées, mêmes quatre états, rendu différent. */
function PaginatedTasks({ view, filters, actions, onPageChange, onCreate, onResetFilters }: PaginatedTasksProps) {
  const { data, isPending, isError, error, refetch } = useTasks(filters)

  return (
    <section className="bg-card shadow-card rounded-card overflow-hidden border">
      {isPending && <TaskTableSkeleton />}

      {isError && <ErrorState message={extractApiError(error).message} onRetry={() => refetch()} />}

      {data && data.content.length === 0 && !hasActiveFilters(filters) && (
        <EmptyState
          icon={ListChecksIcon}
          title="Aucune tâche pour l'instant"
          description="Créez votre première tâche pour commencer à organiser votre travail."
          action={{ label: 'Créer une tâche', onClick: onCreate }}
        />
      )}

      {data && data.content.length === 0 && hasActiveFilters(filters) && (
        <EmptyState
          icon={SearchXIcon}
          title="Aucun résultat"
          description="Aucune tâche ne correspond à cette recherche ou à ces filtres."
          action={{ label: 'Réinitialiser les filtres', onClick: onResetFilters }}
        />
      )}

      {data && data.content.length > 0 && (
        <>
          {view === 'table' ? (
            <TaskTable tasks={data.content} {...actions} />
          ) : (
            <TaskList tasks={data.content} {...actions} />
          )}
          <TasksPagination
            page={data.page}
            size={data.size}
            totalElements={data.totalElements}
            totalPages={data.totalPages}
            first={data.first}
            last={data.last}
            onPageChange={onPageChange}
          />
        </>
      )}
    </section>
  )
}
