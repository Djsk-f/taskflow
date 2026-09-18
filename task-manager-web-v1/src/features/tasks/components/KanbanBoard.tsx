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
import { useQueries } from '@tanstack/react-query'
import { useState } from 'react'

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
      accessibility={{ announcements, screenReaderInstructions }}
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

const columnLabel = (id: string | number | undefined) =>
  id && id in TASK_STATUS_META ? TASK_STATUS_META[id as TaskStatus].label : 'aucune colonne'

const titleOf = (data: Record<string, unknown> | undefined) => (data?.task as Task | undefined)?.title ?? 'la tâche'

const announcements: Announcements = {
  onDragStart: ({ active }) => `« ${titleOf(active.data.current)} » saisie.`,
  onDragOver: ({ active, over }) => `« ${titleOf(active.data.current)} » au-dessus de la colonne ${columnLabel(over?.id)}.`,
  onDragEnd: ({ active, over }) => `« ${titleOf(active.data.current)} » déposée dans ${columnLabel(over?.id)}.`,
  onDragCancel: ({ active }) => `Déplacement de « ${titleOf(active.data.current)} » annulé.`,
}

const screenReaderInstructions = {
  draggable:
    'Pour déplacer la carte, appuyer sur Espace, utiliser les flèches pour changer de colonne, puis Espace pour déposer ou Échap pour annuler.',
}
