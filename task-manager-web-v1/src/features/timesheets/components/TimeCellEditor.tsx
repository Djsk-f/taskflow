import { useTimeEntryMutations } from '@/features/timesheets/hooks/useTimeEntries'
import type { TimeEntry } from '@/features/timesheets/types'
import { extractApiError } from '@/shared/api/extractApiError'
import { translateMessage } from '@/shared/i18n/translateMessage'
import { formatDuration, parseDuration } from '@/shared/lib/duration'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Trash2Icon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

type TimeCellEditorProps = {
  taskId: number
  workDate: string
  entries: TimeEntry[]
}

/** Contenu du panneau d'une case : saisies du jour pour la tâche, suppression, ajout rapide. */
export function TimeCellEditor({ taskId, workDate, entries }: TimeCellEditorProps) {
  const { t } = useTranslation()
  const { createEntry, deleteEntry } = useTimeEntryMutations()
  const [duration, setDuration] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const minutes = parseDuration(duration)
    if (minutes === null) {
      setError('validation.time.duration')
      return
    }
    setError(null)
    try {
      await createEntry.mutateAsync({ taskId, workDate, durationMinutes: minutes, note: note.trim() || undefined })
      setDuration('')
      setNote('')
    } catch (apiError) {
      setError(extractApiError(apiError).message)
    }
  }

  return (
    <div className="space-y-3">
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('timesheets.cell.empty')}</p>
      ) : (
        <ul className="divide-y">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-2 py-1">
              <div className="min-w-0 flex-1 text-sm">
                <span className="font-medium tabular-nums">{formatDuration(entry.durationMinutes)}</span>
                {entry.note && <span className="text-muted-foreground block truncate text-xs">{entry.note}</span>}
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

      <form onSubmit={submit} noValidate className="space-y-2 border-t pt-3">
        <div className="flex gap-2">
          <Input
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            placeholder={t('timesheets.form.durationPlaceholder')}
            aria-label={t('timesheets.form.duration')}
            aria-invalid={error !== null}
            aria-describedby="time-cell-hint"
            className="w-24"
            autoFocus
          />
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('timesheets.form.note')}
            aria-label={t('timesheets.form.note')}
            maxLength={500}
          />
          <Button type="submit" disabled={createEntry.isPending}>
            {t('timesheets.cell.add')}
          </Button>
        </div>
        <p id="time-cell-hint" className={error ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}>
          {error ? translateMessage(t, error) : t('timesheets.form.durationHint')}
        </p>
      </form>
    </div>
  )
}
