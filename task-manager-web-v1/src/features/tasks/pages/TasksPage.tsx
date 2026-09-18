import { useAuth } from '@/features/auth/useAuth'
import { DeleteTaskDialog } from '@/features/tasks/components/DeleteTaskDialog'
import { KanbanBoard } from '@/features/tasks/components/KanbanBoard'
import { TaskFiltersBar } from '@/features/tasks/components/TaskFilters'
import { TaskFormDialog } from '@/features/tasks/components/TaskFormDialog'
import { TaskList } from '@/features/tasks/components/TaskList'
import type { TaskActionHandlers } from '@/features/tasks/components/TaskRowActions'
import { TaskTable } from '@/features/tasks/components/TaskTable'
import { TaskTableSkeleton } from '@/features/tasks/components/TaskTableSkeleton'
import { TaskViewTabs } from '@/features/tasks/components/TaskViewTabs'
import { useMoveTask } from '@/features/tasks/hooks/useMoveTask'
import { TASKS_QUERY_KEY, useTasks } from '@/features/tasks/hooks/useTasks'
import { taskApi } from '@/features/tasks/api/taskApi'
import { LogTimeDialog } from '@/features/timesheets/components/LogTimeDialog'
import {
  hasActiveFilters,
  PAGE_SIZES,
  readTaskFilters,
  readTaskView,
  withTaskView,
  writeTaskFilters,
} from '@/features/tasks/taskFilters'
import { taskDraftStorage } from '@/features/tasks/taskDraft'
import type { Task, TaskFilters, TaskSort, TaskStatus, TaskView } from '@/features/tasks/types'
import { extractApiError } from '@/shared/api/extractApiError'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { AppShell } from '@/shared/components/layout/AppShell'
import { Pagination } from '@/shared/components/pagination/Pagination'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/shared/ui/button'
import { ListChecksIcon, PlusIcon, SearchXIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

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

  // Saisie interrompue par une session expirée : le formulaire se rouvre avec elle.
  const { user } = useAuth()
  const [draft, setDraft] = useState(() => (user ? taskDraftStorage.read(user.id) : null))
  useEffect(() => {
    if (draft) {
      taskDraftStorage.clear()
    }
  }, [draft])

  const [formOpen, setFormOpen] = useState(draft !== null)
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined)
  const [createStatus, setCreateStatus] = useState<TaskStatus>('TODO')
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [taskToLog, setTaskToLog] = useState<Task | null>(null)
  const { moveTask, pendingMoves } = useMoveTask()

  // Lien direct vers une tâche (cloche, notification du navigateur) : ?task=42 l'ouvre
  // en modification, puis le paramètre est retiré (un rechargement ne la rouvre pas).
  const linkedTaskId = Number(searchParams.get('task')) || null
  const linkedTask = useQuery({
    queryKey: [TASKS_QUERY_KEY, 'one', linkedTaskId],
    queryFn: () => taskApi.get(linkedTaskId as number),
    enabled: linkedTaskId !== null,
    retry: false,
  })
  // Ajusté pendant le rendu (pas d'effet) ; remis à zéro une fois le lien consommé, pour
  // qu'une seconde notification sur la même tâche la rouvre.
  const [openedLink, setOpenedLink] = useState<number | null>(null)
  if (linkedTaskId === null && openedLink !== null) {
    setOpenedLink(null)
  }
  if (linkedTask.data && linkedTask.data.id !== openedLink) {
    setOpenedLink(linkedTask.data.id)
    setDraft(null)
    setTaskToEdit(linkedTask.data)
    setFormOpen(true)
  }
  const linkSettled = linkedTaskId !== null && !linkedTask.isPending
  useEffect(() => {
    if (!linkSettled) {
      return
    }
    if (linkedTask.isError) {
      toast.error(extractApiError(linkedTask.error).message)
    }
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params)
        next.delete('task')
        return next
      },
      { replace: true },
    )
  }, [linkSettled]) // eslint-disable-line react-hooks/exhaustive-deps
  const { t } = useTranslation()

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
    setDraft(null)
    setTaskToEdit(undefined)
    setCreateStatus(status)
    setFormOpen(true)
  }

  const actions: TaskActionHandlers = {
    onEdit: (task) => {
      setDraft(null)
      setTaskToEdit(task)
      setFormOpen(true)
    },
    onDelete: setTaskToDelete,
    onMove: moveTask,
    onLogTime: setTaskToLog,
  }

  const resetFilters = () => {
    setSearchDraft('')
    navigate({ ...filters, search: '', status: null, priority: null, due: null, page: 0 })
  }

  return (
    <AppShell
      title={t('tasks.title')}
      action={
        <Button onClick={() => openCreateForm()} aria-label={t('tasks.create')}>
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">{t('tasks.create')}</span>
        </Button>
      }
      toolbar={<TaskViewTabs view={view} onChange={changeView} />}
    >
      <div className="mb-6">
        <TaskFiltersBar
          searchDraft={searchDraft}
          onSearchDraftChange={setSearchDraft}
          status={filters.status}
          onStatusChange={(status) => applyFilters({ status })}
          priority={filters.priority}
          onPriorityChange={(priority) => applyFilters({ priority })}
          due={filters.due}
          onDueChange={(due) => applyFilters({ due })}
          sort={filters.sort}
          onSortChange={(sort) => applyFilters({ sort })}
          onClearFilters={() => applyFilters({ priority: null, status: null, due: null })}
          showStatus={view !== 'kanban'}
        />
      </div>

      {view === 'kanban' ? (
        <KanbanBoard
          search={filters.search}
          priority={filters.priority}
          due={filters.due}
          sort={filters.sort}
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
          onPageSizeChange={(size) => applyFilters({ size, page: 0 })}
          onSortChange={(sort) => applyFilters({ sort })}
          onCreate={() => openCreateForm()}
          onResetFilters={resetFilters}
        />
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setDraft(null)
          }
        }}
        task={taskToEdit}
        defaultStatus={createStatus}
        draft={draft}
      />
      <DeleteTaskDialog task={taskToDelete} onClose={() => setTaskToDelete(null)} />
      <LogTimeDialog task={taskToLog} onClose={() => setTaskToLog(null)} />
    </AppShell>
  )
}

type PaginatedTasksProps = {
  view: Exclude<TaskView, 'kanban'>
  filters: TaskFilters
  actions: TaskActionHandlers
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSortChange: (sort: TaskSort) => void
  onCreate: () => void
  onResetFilters: () => void
}

/** Vues Grille et Liste : mêmes données paginées, mêmes quatre états, rendu différent. */
function PaginatedTasks({
  view,
  filters,
  actions,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onCreate,
  onResetFilters,
}: PaginatedTasksProps) {
  const { data, isPending, isError, error, refetch } = useTasks(filters)
  const { t } = useTranslation()

  return (
    <section className="bg-card shadow-card rounded-card overflow-hidden border">
      {isPending && <TaskTableSkeleton />}

      {isError && <ErrorState message={extractApiError(error).message} onRetry={() => refetch()} />}

      {data && data.content.length === 0 && !hasActiveFilters(filters) && (
        <EmptyState
          icon={ListChecksIcon}
          title={t('tasks.empty.title')}
          description={t('tasks.empty.description')}
          action={{ label: t('tasks.empty.action'), onClick: onCreate }}
        />
      )}

      {data && data.content.length === 0 && hasActiveFilters(filters) && (
        <EmptyState
          icon={SearchXIcon}
          title={t('tasks.noResults.title')}
          description={t('tasks.noResults.description')}
          action={{ label: t('tasks.noResults.reset'), onClick: onResetFilters }}
        />
      )}

      {data && data.content.length > 0 && (
        <>
          {view === 'table' ? (
            <TaskTable tasks={data.content} sort={filters.sort} onSortChange={onSortChange} {...actions} />
          ) : (
            <TaskList tasks={data.content} {...actions} />
          )}
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={onPageChange}
            rangeLabel={t('tasks.pagination.range', {
              from: data.page * data.size + 1,
              to: data.page * data.size + data.content.length,
              count: data.totalElements,
            })}
            pageSize={filters.size}
            pageSizes={PAGE_SIZES}
            onPageSizeChange={onPageSizeChange}
          />
        </>
      )}
    </section>
  )
}
