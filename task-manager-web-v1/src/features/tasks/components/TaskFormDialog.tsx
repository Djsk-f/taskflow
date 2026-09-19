import { useAuth } from '@/features/auth/useAuth'
import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations'
import {
  REMINDER_MODES,
  taskFormSchema,
  toTaskFormValues,
  toTaskPayload,
  type TaskFormValues,
} from '@/features/tasks/schemas'
import { useTaskOptions } from '@/features/tasks/hooks/useTaskOptions'
import { taskDraftStorage, type TaskDraft } from '@/features/tasks/taskDraft'
import type { Task, TaskStatus } from '@/features/tasks/types'
import { isSessionExpiredError, onSessionExpired } from '@/shared/api/httpClient'
import { FormAlert } from '@/shared/components/feedback/FormAlert'
import { FormNotice } from '@/shared/components/feedback/FormNotice'
import { applyApiErrorToForm } from '@/shared/components/form/applyApiErrorToForm'
import { FormSelectField } from '@/shared/components/form/FormSelectField'
import { FormTextareaField } from '@/shared/components/form/FormTextareaField'
import { FormTextField } from '@/shared/components/form/FormTextField'
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
import { HistoryIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

const EMPTY_VALUES: TaskFormValues = {
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: '',
  reminder: 'NONE',
  reminderAt: '',
}

type TaskFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Tâche à modifier ; absente, le formulaire est en création. */
  task?: Task
  /** Statut proposé en création (bouton « + » d'une colonne Kanban). */
  defaultStatus?: TaskStatus
  /** Saisie interrompue par une session expirée, à reprendre après la reconnexion. */
  draft?: TaskDraft | null
}

/**
 * Création ET modification dans un seul composant (EX-04, EX-05) : deux modales séparées
 * seraient la duplication la plus coûteuse de cet écran (INV-21).
 */
export function TaskFormDialog({ open, onOpenChange, task, defaultStatus = 'TODO', draft = null }: TaskFormDialogProps) {
  const { createTask, updateTask } = useTaskMutations()
  const { user } = useAuth()
  const [alert, setAlert] = useState<string | null>(null)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const { t } = useTranslation()
  const { statusOptions, priorityOptions } = useTaskOptions()
  const taskId = task?.id ?? draft?.taskId
  const isEditing = taskId !== undefined

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: EMPTY_VALUES,
  })
  // Lu pendant le rendu : react-hook-form ne calcule isDirty que pour qui s'y abonne.
  const { isDirty } = form.formState
  const reminder = useWatch({ control: form.control, name: 'reminder' })
  const reminderOptions = REMINDER_MODES.map((mode) => ({ value: mode, label: t(`tasks.form.reminderModes.${mode}`) }))

  // À chaque ouverture, le formulaire repart de la tâche visée (ou à vide) : sans cela une
  // édition laisserait les valeurs de la précédente.
  useEffect(() => {
    if (!open) {
      return
    }
    form.reset(task ? toTaskFormValues(task) : { ...EMPTY_VALUES, status: defaultStatus })
    // Un brouillon restauré compte comme une saisie : le fermer demandera confirmation.
    if (draft) {
      form.reset(draft.values, { keepDefaultValues: true })
    }
  }, [open, task, defaultStatus, draft, form])

  // Session expirée pendant la saisie (à l'envoi ou sur une requête de fond) : la saisie
  // est mise de côté juste avant la redirection vers la connexion, puis rendue au retour.
  const draftContext = useRef({ open, userId: user?.id, taskId })
  useEffect(() => {
    draftContext.current = { open, userId: user?.id, taskId }
  })
  useEffect(
    () =>
      onSessionExpired(() => {
        const { open: isOpen, userId, taskId: editedId } = draftContext.current
        if (isOpen && userId !== undefined && form.formState.isDirty) {
          taskDraftStorage.save({ userId, taskId: editedId, values: form.getValues() })
        }
      }),
    [form],
  )

  // L'alerte est vidée à la fermeture : la modale se ferme toujours avant de se rouvrir.
  const close = () => {
    setAlert(null)
    setConfirmingDiscard(false)
    onOpenChange(false)
  }

  // Échap, clic à côté ou « Annuler » : une saisie en cours n'est jamais jetée sans accord.
  const requestClose = () => {
    if (isDirty) {
      setConfirmingDiscard(true)
    } else {
      close()
    }
  }

  const onSubmit = async (values: TaskFormValues) => {
    setAlert(null)
    const payload = toTaskPayload(values)
    try {
      if (taskId !== undefined) {
        await updateTask.mutateAsync({ id: taskId, payload })
      } else {
        await createTask.mutateAsync(payload)
      }
      close()
    } catch (error) {
      if (isSessionExpiredError(error)) {
        return // saisie déjà mise de côté par onSessionExpired
      }
      setAlert(applyApiErrorToForm(error, form.setError))
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : requestClose())}>
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
            {draft && <FormNotice icon={HistoryIcon} message={t('tasks.form.draftRestored')} />}

            <FormTextField control={form.control} name="title" label={t('tasks.form.title')} placeholder={t('tasks.form.titlePlaceholder')} />
            <FormTextareaField
              control={form.control}
              name="description"
              label={t('tasks.form.description')}
              placeholder={t('tasks.form.descriptionPlaceholder')}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelectField
              control={form.control}
              name="status"
              label={t('tasks.form.status')}
              options={statusOptions}
              disabled={task?.status === 'DONE'}
            />
              <FormSelectField control={form.control} name="priority" label={t('tasks.form.priority')} options={priorityOptions} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormTextField control={form.control} name="dueDate" label={t('tasks.form.dueDate')} type="datetime-local" />
              <FormSelectField control={form.control} name="reminder" label={t('tasks.form.reminder')} options={reminderOptions} />
            </div>
            {reminder === 'CUSTOM' && (
              <FormTextField
                control={form.control}
                name="reminderAt"
                label={t('tasks.form.reminderAt')}
                type="datetime-local"
                hint={t('tasks.form.reminderHint')}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={requestClose}>
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

      <AlertDialog open={confirmingDiscard} onOpenChange={setConfirmingDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tasks.form.discard.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('tasks.form.discard.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('tasks.form.discard.keep')}</AlertDialogCancel>
            <AlertDialogAction onClick={close}>{t('tasks.form.discard.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
