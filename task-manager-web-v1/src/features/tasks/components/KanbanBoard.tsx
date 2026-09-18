import { KanbanColumn } from '@/features/tasks/components/KanbanColumn'
import { TaskCardPreview } from '@/features/tasks/components/TaskCard'
import type { TaskActionHandlers } from '@/features/tasks/components/TaskRowActions'
import { tasksQueryOptions } from '@/features/tasks/hooks/useTasks'
import { TASK_STATUS_META } from '@/features/tasks/taskMeta'
import { TASK_STATUSES, type Task, type TaskPriority, type TaskStatus } from '@/features/tasks/types'
import { extractApiError } from '@/shared/api/extractApiError'
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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

/** Nombre maximal de cartes chargées par colonne (plafond serveur) ; le reste est dans le tableau. */
const COLUMN_SIZE = 50

type KanbanBoardProps = {
  search: string
  priority: TaskPriority | null
  pendingMoves: Record<number, TaskStatus>
  onCreate: (status: TaskStatus) => void
  onShowInTable: (status: TaskStatus) => void
} & TaskActionHandlers

/**
 * Vue Kanban (bonus B-01), vue par défaut comme sur la capture : une colonne par statut,
 * glisser-déposer à la souris, au doigt ou au clavier. La recherche et le filtre de
 * priorité s'appliquent à toutes les colonnes.
 */
export function KanbanBoard({ search, priority, pendingMoves, onCreate, onShowInTable, ...actions }: KanbanBoardProps) {
  const queries = useQueries({
    queries: TASK_STATUSES.map((status) =>
      tasksQueryOptions({ search, priority, status, page: 0, size: COLUMN_SIZE }),
    ),
  })
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
