import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations'
import { taskFormSchema, toTaskPayload, type TaskFormValues } from '@/features/tasks/schemas'
import { useTaskOptions } from '@/features/tasks/hooks/useTaskOptions'
import type { Task, TaskStatus } from '@/features/tasks/types'
import { FormAlert } from '@/shared/components/feedback/FormAlert'
import { applyApiErrorToForm } from '@/shared/components/form/applyApiErrorToForm'
import { FormSelectField } from '@/shared/components/form/FormSelectField'
import { FormTextareaField } from '@/shared/components/form/FormTextareaField'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { toDateTimeLocalValue } from '@/shared/lib/formatDate'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

const EMPTY_VALUES: TaskFormValues = {
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: '',
}

type TaskFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Tâche à modifier ; absente, le formulaire est en création. */
  task?: Task
  /** Statut proposé en création (bouton « + » d'une colonne Kanban). */
  defaultStatus?: TaskStatus
}

/**
 * Création ET modification dans un seul composant (EX-04, EX-05) : deux modales séparées
 * seraient la duplication la plus coûteuse de cet écran (INV-21).
 */
export function TaskFormDialog({ open, onOpenChange, task, defaultStatus = 'TODO' }: TaskFormDialogProps) {
  const { createTask, updateTask } = useTaskMutations()
  const [alert, setAlert] = useState<string | null>(null)
  const { t } = useTranslation()
  const { statusOptions, priorityOptions } = useTaskOptions()
  const isEditing = task !== undefined

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  // À chaque ouverture, le formulaire repart de la tâche visée (ou à vide) : sans cela une
  // édition laisserait les valeurs de la précédente.
  useEffect(() => {
    if (!open) {
      return
    }
    form.reset(
      task
        ? {
            title: task.title,
            description: task.description ?? '',
            status: task.status,
            priority: task.priority,
            dueDate: toDateTimeLocalValue(task.dueDate),
          }
        : { ...EMPTY_VALUES, status: defaultStatus },
    )
  }, [open, task, defaultStatus, form])

  // L'alerte est vidée à la fermeture : la modale se ferme toujours avant de se rouvrir.
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAlert(null)
    }
    onOpenChange(nextOpen)
  }

  const onSubmit = async (values: TaskFormValues) => {
    setAlert(null)
    const payload = toTaskPayload(values)
    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, payload })
      } else {
        await createTask.mutateAsync(payload)
      }
      handleOpenChange(false)
    } catch (error) {
      setAlert(applyApiErrorToForm(error, form.setError))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('tasks.form.editTitle') : t('tasks.form.createTitle')}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('tasks.form.editDescription')
              : t('tasks.form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {alert && <FormAlert message={alert} />}

          <FormTextField control={form.control} name="title" label={t('tasks.form.title')} placeholder={t('tasks.form.titlePlaceholder')} />
          <FormTextareaField
            control={form.control}
            name="description"
            label={t('tasks.form.description')}
            placeholder={t('tasks.form.descriptionPlaceholder')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelectField control={form.control} name="status" label={t('tasks.form.status')} options={statusOptions} />
            <FormSelectField control={form.control} name="priority" label={t('tasks.form.priority')} options={priorityOptions} />
          </div>

          <FormTextField control={form.control} name="dueDate" label={t('tasks.form.dueDate')} type="datetime-local" />

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? t('common.saving')
                : isEditing
                  ? t('common.save')
                  : t('tasks.form.submitCreate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
