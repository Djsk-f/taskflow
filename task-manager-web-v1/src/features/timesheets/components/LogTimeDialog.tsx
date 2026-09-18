import type { Task } from '@/features/tasks/types'
import { useTaskTimeEntries, useTimeEntryMutations } from '@/features/timesheets/hooks/useTimeEntries'
import { timeEntryFormSchema, type TimeEntryFormValues } from '@/features/timesheets/schemas'
import { FormAlert } from '@/shared/components/feedback/FormAlert'
import { applyApiErrorToForm } from '@/shared/components/form/applyApiErrorToForm'
import { FormTextareaField } from '@/shared/components/form/FormTextareaField'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { formatDuration, parseDuration } from '@/shared/lib/duration'
import { formatLongDay, fromIsoDate, toIsoDate } from '@/shared/lib/week'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Skeleton } from '@/shared/ui/skeleton'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

type LogTimeDialogProps = {
  /** Tâche visée ; null ferme la fenêtre. */
  task: Task | null
  onClose: () => void
}

/** Saisie du temps passé sur une tâche, avec l'historique de ses saisies. */
export function LogTimeDialog({ task, onClose }: LogTimeDialogProps) {
  const { t } = useTranslation()
  const { createEntry, deleteEntry } = useTimeEntryMutations()
  const { data: entries, isPending } = useTaskTimeEntries(task?.id)
  const [alert, setAlert] = useState<string | null>(null)

  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: { workDate: toIsoDate(new Date()), duration: '', note: '' },
  })

  useEffect(() => {
    if (task) {
      form.reset({ workDate: toIsoDate(new Date()), duration: '', note: '' })
    }
  }, [task, form])

  const close = () => {
    setAlert(null)
    onClose()
  }

  const onSubmit = async (values: TimeEntryFormValues) => {
    if (!task) {
      return
    }
    setAlert(null)
    try {
      await createEntry.mutateAsync({
        taskId: task.id,
        workDate: values.workDate,
        durationMinutes: parseDuration(values.duration) as number,
        note: values.note || undefined,
      })
      // La date reste : on enchaîne souvent plusieurs saisies sur la même journée.
      form.reset({ workDate: values.workDate, duration: '', note: '' })
    } catch (error) {
      setAlert(applyApiErrorToForm(error, form.setError))
    }
  }

  const total = (entries ?? []).reduce((sum, entry) => sum + entry.durationMinutes, 0)

  return (
    <Dialog open={task !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('timesheets.form.title')}</DialogTitle>
          <DialogDescription>{t('timesheets.form.description', { title: task?.title ?? '' })}</DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {alert && <FormAlert message={alert} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField control={form.control} name="workDate" label={t('timesheets.form.date')} type="date" />
            <FormTextField
              control={form.control}
              name="duration"
              label={t('timesheets.form.duration')}
              placeholder={t('timesheets.form.durationPlaceholder')}
              hint={t('timesheets.form.durationHint')}
            />
          </div>
          <FormTextareaField
            control={form.control}
            name="note"
            label={t('timesheets.form.note')}
            placeholder={t('timesheets.form.notePlaceholder')}
            rows={2}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t('common.saving') : t('timesheets.form.submit')}
            </Button>
          </div>
        </form>

        <section aria-labelledby="time-history" className="border-t pt-4">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 id="time-history" className="text-sm font-semibold">
              {t('timesheets.form.history')}
            </h3>
            {total > 0 && (
              <span className="text-muted-foreground text-sm">
                {t('timesheets.form.total', { duration: formatDuration(total) })}
              </span>
            )}
          </div>

          {isPending && <Skeleton className="h-10 w-full" />}
          {entries && entries.length === 0 && (
            <p className="text-muted-foreground text-sm">{t('timesheets.form.historyEmpty')}</p>
          )}
          {entries && entries.length > 0 && (
            <ul className="max-h-56 divide-y overflow-y-auto">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium tabular-nums">{formatDuration(entry.durationMinutes)}</span>
                      <span className="text-muted-foreground"> · {formatLongDay(fromIsoDate(entry.workDate))}</span>
                    </p>
                    {entry.note && (
                      <p className="text-muted-foreground truncate text-xs [overflow-wrap:anywhere]">{entry.note}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteEntry.mutate(entry.id)}
                    aria-label={t('timesheets.entry.delete', { duration: formatDuration(entry.durationMinutes) })}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </DialogContent>
    </Dialog>
  )
}
