import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations'
import { TASK_STATUS_META } from '@/features/tasks/taskMeta'
import type { Task, TaskStatus } from '@/features/tasks/types'
import { extractApiError } from '@/shared/api/extractApiError'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

/**
 * Déplacement d'une tâche vers un autre statut — glisser-déposer du Kanban, menu
 * « Déplacer vers » ou case « terminée ». `pendingMoves` porte la mise à jour optimiste :
 * la carte change de colonne immédiatement, et revient à sa place si le serveur refuse.
 * Le toast de confirmation propose « Annuler », qui rend à la tâche son statut d'avant.
 */
export function useMoveTask() {
  const { updateStatus } = useTaskMutations()
  const [pendingMoves, setPendingMoves] = useState<Record<number, TaskStatus>>({})
  const { t } = useTranslation()

  const moveTask = async (task: Task, status: TaskStatus, undoable = true) => {
    if (task.status === status) {
      return
    }
    setPendingMoves((moves) => ({ ...moves, [task.id]: status }))
    try {
      await updateStatus.mutateAsync({ id: task.id, status })
      const message = t('tasks.moved', { title: task.title, status: t(TASK_STATUS_META[status].labelKey) })
      toast.success(
        message,
        undoable
          ? {
              duration: UNDO_DELAY_MS,
              action: { label: t('common.undo'), onClick: () => void moveTask({ ...task, status }, task.status, false) },
            }
          : undefined,
      )
    } catch (error) {
      toast.error(extractApiError(error).message)
    } finally {
      setPendingMoves((moves) => {
        const { [task.id]: _settled, ...rest } = moves
        return rest
      })
    }
  }

  return { moveTask, pendingMoves }
}

/** Laisse le temps de lire le message et d'atteindre « Annuler » (clavier compris). */
const UNDO_DELAY_MS = 8000
