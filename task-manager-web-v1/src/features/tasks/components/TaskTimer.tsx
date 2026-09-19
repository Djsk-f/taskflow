import { formatStopwatch } from '@/shared/lib/duration'
import { useNow } from '@/shared/hooks/useNow'
import { TimerIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Chrono d'une tâche « En cours », à la seconde ; enregistré quand elle change de statut. */
export function TaskTimer({ startedAt }: { startedAt: string }) {
  const now = useNow(1000)
  const { t } = useTranslation()
  const elapsed = formatStopwatch((now - Date.parse(startedAt)) / 1000)
  const label = t('tasks.timer.label', { duration: elapsed })
  return (
    <span className="text-status-progress-text inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap tabular-nums" title={label}>
      <TimerIcon className="size-3.5 motion-safe:animate-pulse" />
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{elapsed}</span>
    </span>
  )
}
