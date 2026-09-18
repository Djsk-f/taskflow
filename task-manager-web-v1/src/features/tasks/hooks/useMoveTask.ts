import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations'
import { TASK_STATUS_META } from '@/features/tasks/taskMeta'
import type { Task, TaskStatus } from '@/features/tasks/types'
import { extractApiError } from '@/shared/api/extractApiError'
import { useState } from 'react'
import { toast } from 'sonner'

/**
 * Déplacement d'une tâche vers un autre statut — glisser-déposer du Kanban ou menu
 * « Déplacer vers ». `pendingMoves` porte la mise à jour optimiste : la carte change de
 * colonne immédiatement, et revient à sa place si le serveur refuse.
 */
export function useMoveTask() {
  const { updateStatus } = useTaskMutations()
  const [pendingMoves, setPendingMoves] = useState<Record<number, TaskStatus>>({})

  const moveTask = async (task: Task, status: TaskStatus) => {
    if (task.status === status) {
      return
    }
    setPendingMoves((moves) => ({ ...moves, [task.id]: status }))
    try {
      await updateStatus.mutateAsync({ id: task.id, status })
      toast.success(`« ${task.title} » déplacée vers ${TASK_STATUS_META[status].label}.`)
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
