import type { TimeEntry } from '@/features/timesheets/types'
import { currentLanguage, i18n } from '@/shared/i18n/i18n'

/**
 * Export CSV de la feuille affichée, lisible directement par Excel : en français,
 * séparateur « ; » et virgule décimale ; en anglais, « , » et point. BOM UTF-8 pour
 * que les accents s'affichent correctement.
 */
export function exportTimesheetCsv(entries: TimeEntry[], fileSuffix: string): void {
  const french = currentLanguage() === 'fr'
  const separator = french ? ';' : ','
  const cell = (value: string) => `"${value.replaceAll('"', '""')}"`
  const hours = (minutes: number) => {
    const value = (minutes / 60).toFixed(2)
    return french ? value.replace('.', ',') : value
  }

  const header = ['date', 'task', 'status', 'hours', 'minutes', 'note'].map((key) =>
    cell(i18n.t(`timesheets.csv.${key as 'date'}`)),
  )
  const rows = entries.map((entry) =>
    [
      cell(entry.workDate),
      cell(entry.taskTitle),
      cell(i18n.t(`status.${entry.taskStatus}`)),
      hours(entry.durationMinutes),
      String(entry.durationMinutes),
      cell(entry.note ?? ''),
    ].join(separator),
  )
  const csv = '﻿' + [header.join(separator), ...rows].join('\r\n')

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `timesheet-${fileSuffix}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
