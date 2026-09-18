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
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

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
          <AlertDialogTitle>{t('tasks.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('tasks.delete.description', { title: task?.title ?? '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={deleteTask.isPending}>
            {deleteTask.isPending ? t('tasks.delete.pending') : t('tasks.delete.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
