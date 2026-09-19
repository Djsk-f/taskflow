import { currentLanguage } from '@/shared/i18n/i18n'

export const MAX_ENTRY_MINUTES = 24 * 60

/**
 * Lit une durée saisie librement : « 1h30 », « 1h », « 45m », « 45 min », « 1:30 »,
 * « 1.5 » / « 1,5 » ou « 2 » (un nombre seul se lit en heures, l'usage des feuilles de
 * temps). Renvoie des minutes, ou null si la saisie est illisible ou hors 1 min – 24 h.
 */
export function parseDuration(input: string): number | null {
  const value = input.trim().toLowerCase().replace(/\s+/g, '')
  if (!value) {
    return null
  }
  let minutes: number | null = null
  const hoursMinutes = /^(\d{1,2})h(\d{1,2})?(?:m|min)?$/.exec(value)
  const clock = /^(\d{1,2}):(\d{2})$/.exec(value)
  const onlyMinutes = /^(\d{1,4})(?:m|min)$/.exec(value)
  const decimalHours = /^(\d{1,2})(?:[.,](\d{1,2}))?$/.exec(value)
  // Dans « 1h30 » ou « 1:30 », la partie minutes reste sous 60 (« 1h75 » est une faute de frappe).
  if (hoursMinutes && Number(hoursMinutes[2] ?? 0) < 60) {
    minutes = Number(hoursMinutes[1]) * 60 + Number(hoursMinutes[2] ?? 0)
  } else if (clock && Number(clock[2]) < 60) {
    minutes = Number(clock[1]) * 60 + Number(clock[2])
  } else if (onlyMinutes) {
    minutes = Number(onlyMinutes[1])
  } else if (decimalHours) {
    minutes = Math.round(Number(`${decimalHours[1]}.${decimalHours[2] ?? 0}`) * 60)
  }
  return minutes !== null && minutes >= 1 && minutes <= MAX_ENTRY_MINUTES ? minutes : null
}

/** « 1 h 30 », « 45 min », « 2 h » en français ; « 1h 30m », « 45m », « 2h » en anglais. */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const english = currentLanguage() === 'en'
  if (hours === 0) {
    return english ? `${minutes}m` : `${minutes} min`
  }
  if (minutes === 0) {
    return english ? `${hours}h` : `${hours} h`
  }
  return english ? `${hours}h ${minutes}m` : `${hours} h ${String(minutes).padStart(2, '0')}`
}

/** Chronomètre : « 12:05 » sous une heure, « 1:02:05 » au-delà. */
export function formatStopwatch(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
