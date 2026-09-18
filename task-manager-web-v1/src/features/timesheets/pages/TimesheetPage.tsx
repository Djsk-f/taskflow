import { taskApi } from '@/features/tasks/api/taskApi'
import { TASKS_QUERY_KEY } from '@/features/tasks/hooks/useTasks'
import { TASK_STATUS_META } from '@/features/tasks/taskMeta'
import type { TaskStatus } from '@/features/tasks/types'
import { TimeCellEditor } from '@/features/timesheets/components/TimeCellEditor'
import { exportTimesheetCsv } from '@/features/timesheets/exportTimesheetCsv'
import { useTimeEntries } from '@/features/timesheets/hooks/useTimeEntries'
import type { TimeEntry } from '@/features/timesheets/types'
import { extractApiError } from '@/shared/api/extractApiError'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { AppShell } from '@/shared/components/layout/AppShell'
import { formatDuration } from '@/shared/lib/duration'
import { cn } from '@/shared/lib/utils'
import {
  addDays,
  formatLongDay,
  formatWeekRange,
  formatWeekday,
  fromIsoDate,
  startOfWeek,
  toIsoDate,
  weekDays,
} from '@/shared/lib/week'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, DownloadIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

type Row = { taskId: number; title: string; status: TaskStatus }

/**
 * Feuille de temps de la semaine (lundi → dimanche) : une ligne par tâche, une colonne
 * par jour, totaux par ligne, par jour et pour la semaine. La semaine vit dans l'URL.
 */
export function TimesheetPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const weekParam = searchParams.get('week')
  const monday = startOfWeek(weekParam ? fromIsoDate(weekParam) : new Date())
  const days = weekDays(monday)
  const from = toIsoDate(monday)
  const to = toIsoDate(addDays(monday, 6))
  const today = toIsoDate(new Date())

  const { data: entries, isPending, isError, error, refetch } = useTimeEntries(from, to)
  // Lignes ajoutées à la main (sans saisie encore) ; propres à la semaine affichée.
  const [extraRows, setExtraRows] = useState<{ week: string; rows: Row[] }>({ week: from, rows: [] })
  const addedRows = extraRows.week === from ? extraRows.rows : []

  const goToWeek = (date: Date) => {
    const next = new URLSearchParams(searchParams)
    const target = toIsoDate(startOfWeek(date))
    if (target === toIsoDate(startOfWeek(new Date()))) {
      next.delete('week')
    } else {
      next.set('week', target)
    }
    setSearchParams(next, { replace: true })
  }

  const rows = buildRows(entries ?? [], addedRows)
  const minutesFor = (taskId: number, day: string) =>
    (entries ?? [])
      .filter((entry) => entry.taskId === taskId && entry.workDate === day)
      .reduce((sum, entry) => sum + entry.durationMinutes, 0)
  const dayTotal = (day: string) =>
    (entries ?? []).filter((entry) => entry.workDate === day).reduce((sum, entry) => sum + entry.durationMinutes, 0)
  const weekTotal = (entries ?? []).reduce((sum, entry) => sum + entry.durationMinutes, 0)

  return (
    <AppShell
      title={t('timesheets.title')}
      action={
        <Button
          variant="secondary"
          onClick={() => exportTimesheetCsv(entries ?? [], from)}
          disabled={!entries || entries.length === 0}
          aria-label={t('timesheets.export')}
        >
          <DownloadIcon className="size-4" />
          <span className="hidden sm:inline">{t('timesheets.export')}</span>
        </Button>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => goToWeek(addDays(monday, -7))} aria-label={t('timesheets.week.previous')}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button variant="outline" onClick={() => goToWeek(new Date())}>
            {t('timesheets.week.current')}
          </Button>
          <Button variant="outline" size="icon" onClick={() => goToWeek(addDays(monday, 7))} aria-label={t('timesheets.week.next')}>
            <ChevronRightIcon className="size-4" />
          </Button>
          <h2 className="ml-1 text-base font-semibold" aria-live="polite">
            {formatWeekRange(monday)}
          </h2>
          <span className="text-muted-foreground ml-auto inline-flex items-center gap-1.5 text-sm">
            <ClockIcon className="size-4" />
            <span className="tabular-nums">{t('timesheets.grid.weekTotal', { duration: formatDuration(weekTotal) })}</span>
          </span>
        </div>
      }
    >
      <section className="bg-card shadow-card rounded-card overflow-hidden border">
        {isPending && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        )}

        {isError && <ErrorState message={extractApiError(error).message} onRetry={() => refetch()} />}

        {entries && rows.length === 0 && (
          <EmptyState icon={ClockIcon} title={t('timesheets.empty.title')} description={t('timesheets.empty.description')} />
        )}

        {entries && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-sm">
              <caption className="sr-only">{t('timesheets.grid.caption')}</caption>
              <thead>
                <tr className="border-b">
                  <th scope="col" className="bg-card sticky left-0 z-10 w-40 px-4 py-3 text-left font-medium sm:w-64">
                    {t('timesheets.grid.task')}
                  </th>
                  {days.map((day) => {
                    const { weekday, day: number } = formatWeekday(day)
                    const isToday = toIsoDate(day) === today
                    return (
                      <th
                        key={toIsoDate(day)}
                        scope="col"
                        aria-current={isToday ? 'date' : undefined}
                        className={cn('px-2 py-3 text-center font-medium', isToday && 'bg-secondary text-primary')}
                      >
                        <span className="text-muted-foreground block text-xs font-normal capitalize">{weekday}</span>
                        {number}
                      </th>
                    )
                  })}
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    {t('timesheets.grid.total')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const rowTotal = days.reduce((sum, day) => sum + minutesFor(row.taskId, toIsoDate(day)), 0)
                  return (
                    <tr key={row.taskId} className="border-b">
                      <th scope="row" className="bg-card sticky left-0 z-10 px-4 py-2 text-left font-normal">
                        <span className="flex items-center gap-2">
                          <span className={cn('size-2 shrink-0 rounded-full', TASK_STATUS_META[row.status].dotClassName)} />
                          <span className="line-clamp-2 font-medium [overflow-wrap:anywhere]">{row.title}</span>
                        </span>
                      </th>
                      {days.map((day) => {
                        const iso = toIsoDate(day)
                        return (
                          <td key={iso} className={cn('px-1 py-1 text-center', iso === today && 'bg-secondary/40')}>
                            <TimeCell
                              row={row}
                              day={day}
                              minutes={minutesFor(row.taskId, iso)}
                              entries={(entries ?? []).filter((entry) => entry.taskId === row.taskId && entry.workDate === iso)}
                            />
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-right font-semibold tabular-nums">
                        {rowTotal > 0 ? formatDuration(rowTotal) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50">
                  <th scope="row" className="bg-muted sticky left-0 z-10 px-4 py-3 text-left font-semibold">
                    {t('timesheets.grid.dailyTotal')}
                  </th>
                  {days.map((day) => {
                    const total = dayTotal(toIsoDate(day))
                    return (
                      <td key={toIsoDate(day)} className="px-2 py-3 text-center font-semibold tabular-nums">
                        {total > 0 ? formatDuration(total) : '—'}
                      </td>
                    )
                  })}
                  <td className="text-primary px-4 py-3 text-right font-bold tabular-nums">{formatDuration(weekTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {entries && (
          <AddRow
            exclude={rows.map((row) => row.taskId)}
            onAdd={(row) => setExtraRows({ week: from, rows: [...addedRows, row] })}
          />
        )}
      </section>
    </AppShell>
  )
}

/** Lignes : tâches ayant du temps cette semaine, puis celles ajoutées à la main. */
function buildRows(entries: TimeEntry[], added: Row[]): Row[] {
  const rows = new Map<number, Row>()
  entries.forEach((entry) => rows.set(entry.taskId, { taskId: entry.taskId, title: entry.taskTitle, status: entry.taskStatus }))
  added.forEach((row) => {
    if (!rows.has(row.taskId)) {
      rows.set(row.taskId, row)
    }
  })
  return [...rows.values()]
}

function TimeCell({ row, day, minutes, entries }: { row: Row; day: Date; minutes: number; entries: TimeEntry[] }) {
  const { t } = useTranslation()
  const dayLabel = formatLongDay(day)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            minutes > 0
              ? t('timesheets.grid.cell', { task: row.title, day: dayLabel, duration: formatDuration(minutes) })
              : t('timesheets.grid.cellEmpty', { task: row.title, day: dayLabel })
          }
          className={cn(
            'focus-visible:ring-ring/50 flex min-h-10 w-full items-center justify-center rounded-md text-sm tabular-nums transition-colors outline-none focus-visible:ring-[3px]',
            minutes > 0
              ? 'bg-primary/10 text-primary hover:bg-primary/20 font-semibold'
              : 'text-muted-foreground/60 hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {minutes > 0 ? formatDuration(minutes) : <PlusIcon className="size-3.5" />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <p className="mb-3 text-sm font-semibold [overflow-wrap:anywhere]">
          {t('timesheets.cell.title', { task: row.title, day: dayLabel })}
        </p>
        <TimeCellEditor taskId={row.taskId} workDate={toIsoDate(day)} entries={entries} />
      </PopoverContent>
    </Popover>
  )
}

/** Ajout d'une tâche à la feuille : elle apparaît comme ligne vide, prête à recevoir du temps. */
function AddRow({ exclude, onAdd }: { exclude: number[]; onAdd: (row: Row) => void }) {
  const { t } = useTranslation()
  const { data: tasks } = useQuery({ queryKey: [TASKS_QUERY_KEY, 'picker'], queryFn: taskApi.listForPicker })
  const available = (tasks ?? []).filter((task) => !exclude.includes(task.id))
  if (available.length === 0) {
    return null
  }
  return (
    <div className="flex items-center gap-2 border-t px-4 py-3">
      <PlusIcon className="text-muted-foreground size-4" />
      <Select
        value=""
        onValueChange={(value) => {
          const task = available.find((candidate) => String(candidate.id) === value)
          if (task) {
            onAdd({ taskId: task.id, title: task.title, status: task.status })
          }
        }}
      >
        <SelectTrigger className="w-full sm:w-80" aria-label={t('timesheets.addRow')}>
          <SelectValue placeholder={t('timesheets.addRowPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {available.map((task) => (
            <SelectItem key={task.id} value={String(task.id)}>
              {task.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
