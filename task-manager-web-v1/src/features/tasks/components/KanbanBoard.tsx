import { KanbanColumn } from '@/features/tasks/components/KanbanColumn'
import { TaskCardPreview } from '@/features/tasks/components/TaskCard'
import type { TaskActionHandlers } from '@/features/tasks/components/TaskRowActions'
import { tasksQueryOptions } from '@/features/tasks/hooks/useTasks'
import { TASK_STATUS_META } from '@/features/tasks/taskMeta'
import {
  TASK_STATUSES,
  type Task,
  type TaskDueFilter,
  type TaskPriority,
  type TaskSort,
  type TaskStatus,
} from '@/features/tasks/types'
import { extractApiError } from '@/shared/api/extractApiError'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core'
import type { TFunction } from 'i18next'
import { useQueries } from '@tanstack/react-query'
import { ListChecksIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

/** Cartes affichées d'abord par colonne, puis ajoutées par lots de la même taille. */
const COLUMN_STEP = 10
/** Au-delà (plafond serveur), la colonne renvoie vers le tableau paginé. */
const COLUMN_MAX = 50

type KanbanBoardProps = {
  search: string
  priority: TaskPriority | null
  due: TaskDueFilter | null
  sort: TaskSort
  pendingMoves: Record<number, TaskStatus>
  onCreate: (status: TaskStatus) => void
  onShowInTable: (status: TaskStatus) => void
} & TaskActionHandlers

/**
 * Vue Kanban (bonus B-01), vue par défaut comme sur la capture : une colonne par statut,
 * glisser-déposer à la souris, au doigt ou au clavier. Recherche, filtres de priorité et
 * d'échéance et tri s'appliquent à toutes les colonnes.
 */
export function KanbanBoard({
  search,
  priority,
  due,
  sort,
  pendingMoves,
  onCreate,
  onShowInTable,
  ...actions
}: KanbanBoardProps) {
  const [limits, setLimits] = useState<Record<TaskStatus, number>>({
    TODO: COLUMN_STEP,
    IN_PROGRESS: COLUMN_STEP,
    IN_REVIEW: COLUMN_STEP,
    DONE: COLUMN_STEP,
  })
  const queries = useQueries({
    queries: TASK_STATUSES.map((status) =>
      tasksQueryOptions({ search, priority, due, sort, status, page: 0, size: limits[status] }),
    ),
  })
  const showMore = (status: TaskStatus) =>
    setLimits((current) => ({ ...current, [status]: Math.min(current[status] + COLUMN_STEP, COLUMN_MAX) }))
  const columns = TASK_STATUSES.map((status, index) => ({ status, query: queries[index] }))
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const { t } = useTranslation()

  const sensors = useSensors(
    // Une distance minimale laisse passer les clics (titre, menu) sans démarrer de glissement.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Au doigt, un appui prolongé saisit la carte : un glissement court fait défiler la page.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: jumpBetweenColumns }),
  )

  const failed = columns.find((column) => column.query.isError)
  if (failed) {
    return (
      <ErrorState
        message={extractApiError(failed.query.error).message}
        onRetry={() => columns.forEach((column) => column.query.refetch())}
      />
    )
  }

  // Compte neuf : quatre colonnes vides n'expliquent rien, on invite à créer la première tâche.
  const isFiltered = search !== '' || priority !== null || due !== null
  const isEmpty = columns.every((column) => column.query.data?.totalElements === 0)
  if (isEmpty && !isFiltered) {
    return (
      <section className="bg-card shadow-card rounded-card border">
        <EmptyState
          icon={ListChecksIcon}
          title={t('tasks.empty.title')}
          description={t('tasks.empty.description')}
          action={{ label: t('tasks.empty.action'), onClick: () => onCreate('TODO') }}
        />
      </section>
    )
  }

  // Pendant un déplacement, la tâche peut figurer à la fois dans la liste d'origine (pas
  // encore rechargée) et dans celle d'arrivée : on ne garde qu'un exemplaire par identifiant.
  const loaded = [
    ...new Map(columns.flatMap((column) => column.query.data?.content ?? []).map((task) => [task.id, task])).values(),
  ]
  const statusOf = (task: Task) => pendingMoves[task.id] ?? task.status

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTask((active.data.current?.task as Task | undefined) ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    const task = active.data.current?.task as Task | undefined
    const target = over?.id as TaskStatus | undefined
    if (task && target && target !== statusOf(task)) {
      void actions.onMove(task, target)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
      accessibility={{
        announcements: announcementsFor(t),
        screenReaderInstructions: { draggable: t('tasks.kanban.instructions') },
      }}
    >
      {/* Quatre colonnes égales à partir de 1280 px ; en dessous, défilement horizontal
          (une colonne presque pleine largeur sur mobile, avec aimantation). */}
      <div className="-mx-4 grid scroll-px-4 snap-x snap-mandatory auto-cols-[85%] grid-flow-col gap-5 overflow-x-auto px-4 pb-2 sm:auto-cols-[17rem] sm:snap-none lg:mx-0 lg:px-0 xl:grid-flow-row xl:grid-cols-4 xl:overflow-visible">
        {columns.map(({ status, query }) => {
          const tasks = loaded.filter((task) => statusOf(task) === status)
          const loadedHere = query.data?.content.length ?? 0
          const total = (query.data?.totalElements ?? 0) - loadedHere + tasks.length
          return (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasks}
              total={total}
              isLoading={query.isPending}
              isLoadingMore={query.isPlaceholderData}
              canShowMore={limits[status] < COLUMN_MAX}
              step={COLUMN_STEP}
              onShowMore={() => showMore(status)}
              onCreate={onCreate}
              onShowInTable={onShowInTable}
              {...actions}
            />
          )
        })}
      </div>

      <DragOverlay>{activeTask && <TaskCardPreview task={activeTask} {...actions} />}</DragOverlay>
    </DndContext>
  )
}

/**
 * Au clavier, ← et → font sauter la carte d'une colonne à la voisine (par défaut,
 * dnd-kit ne la décale que de quelques pixels). ↑ et ↓ n'ont pas d'effet : une colonne
 * n'a pas d'ordre interne.
 */
const jumpBetweenColumns: KeyboardCoordinateGetter = (event, { context }) => {
  const direction = event.code === 'ArrowRight' ? 1 : event.code === 'ArrowLeft' ? -1 : 0
  const current = context.collisionRect
  if (direction === 0 || !current) {
    return undefined
  }
  event.preventDefault()
  const columns = context.droppableContainers
    .getEnabled()
    .map((container) => context.droppableRects.get(container.id))
    .filter((rect) => rect !== undefined)
    .sort((a, b) => a.left - b.left)
  const center = current.left + current.width / 2
  const target =
    direction === 1
      ? columns.find((rect) => rect.left > center)
      : columns.findLast((rect) => rect.left + rect.width < center)
  return target ? { x: target.left + (target.width - current.width) / 2, y: target.top } : undefined
}

/** Annonces du glisser-déposer pour les lecteurs d'écran, dans la langue de l'interface. */
function announcementsFor(t: TFunction): Announcements {
  const column = (id: string | number | undefined) =>
    id && id in TASK_STATUS_META ? t(TASK_STATUS_META[id as TaskStatus].labelKey) : t('tasks.kanban.noColumn')
  const title = (data: Record<string, unknown> | undefined) =>
    (data?.task as Task | undefined)?.title ?? t('tasks.kanban.theTask')
  return {
    onDragStart: ({ active }) => t('tasks.kanban.announce.start', { title: title(active.data.current) }),
    onDragOver: ({ active, over }) =>
      t('tasks.kanban.announce.over', { title: title(active.data.current), column: column(over?.id) }),
    onDragEnd: ({ active, over }) =>
      t('tasks.kanban.announce.end', { title: title(active.data.current), column: column(over?.id) }),
    onDragCancel: ({ active }) => t('tasks.kanban.announce.cancel', { title: title(active.data.current) }),
  }
}
