import { formattingLocale } from '@/shared/i18n/i18n'

/**
 * Semaines de la feuille de temps : du lundi au dimanche, en heure locale. Les jours
 * s'échangent avec l'API au format `YYYY-MM-DD` (LocalDate), sans fuseau.
 */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function startOfWeek(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  // getDay : 0 = dimanche ; on recule jusqu'au lundi.
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

export function weekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

const locale = formattingLocale

/** « 14 – 20 sept. 2026 » / « Sep 14 – 20, 2026 ». */
export function formatWeekRange(monday: Date): string {
  return new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric' }).formatRange(
    monday,
    addDays(monday, 6),
  )
}

/** En-tête de colonne : « lun. 14 » / « Mon 14 ». */
export function formatWeekday(date: Date): { weekday: string; day: string } {
  return {
    weekday: new Intl.DateTimeFormat(locale(), { weekday: 'short' }).format(date),
    day: new Intl.DateTimeFormat(locale(), { day: 'numeric' }).format(date),
  }
}

export function formatLongDay(date: Date): string {
  return new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}
