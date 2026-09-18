import { formattingLocale, i18n } from '@/shared/i18n/i18n'

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
]

/** « à l'instant », « il y a 5 min », « hier », « in 2 hours » — dans la langue de l'interface. */
export function formatRelative(isoDate: string, now: number = Date.now()): string {
  const diff = new Date(isoDate).getTime() - now
  const format = new Intl.RelativeTimeFormat(formattingLocale(), { numeric: 'auto', style: 'short' })
  for (const [unit, size] of UNITS) {
    if (Math.abs(diff) >= size) {
      return format.format(Math.round(diff / size), unit)
    }
  }
  // Intl dirait « cette minute-ci » : moins naturel pour un événement qui vient d'arriver.
  return i18n.t('common.justNow')
}
