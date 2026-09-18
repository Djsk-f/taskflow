import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations'
import type { Task } from '@/features/tasks/types'
import { extractApiError } from '@/shared/api/extractApiError'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { toast } from 'sonner'

/** Suppression (EX-06) : toujours confirmée, jamais en un seul clic. */
export function DeleteTaskDialog({
  task,
  onClose,
}: {
  task: Task | null
  onClose: () => void
}) {
  const { deleteTask } = useTaskMutations()

  const confirm = async () => {
    if (!task) {
      return
    }
    try {
      await deleteTask.mutateAsync(task.id)
      onClose()
    } catch (error) {
      toast.error(extractApiError(error).message)
    }
  }

  return (
    <AlertDialog open={task !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette tâche ?</AlertDialogTitle>
          <AlertDialogDescription>
            « {task?.title} » sera définitivement supprimée. Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={deleteTask.isPending}>
            {deleteTask.isPending ? 'Suppression…' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
