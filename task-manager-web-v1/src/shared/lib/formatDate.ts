import { formattingLocale } from '@/shared/i18n/i18n'

/** Formateurs Intl mis en cache par langue : créer un Intl.DateTimeFormat coûte cher. */
const formatters = new Map<string, Intl.DateTimeFormat>()

function formatter(name: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  // Format de la variante d'anglais du navigateur : 24/09 pour en-GB, 09/24 pour en-US.
  const locale = formattingLocale()
  const key = `${locale}:${name}`
  let cached = formatters.get(key)
  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, options)
    formatters.set(key, cached)
  }
  return cached
}

/**
 * Formatage et conversion des dates, sans dépendance : `Intl` fait le travail (INV-24).
 * Le serveur échange des instants ISO-8601 en UTC ; l'affichage et les champs de
 * formulaire vivent dans le fuseau du navigateur.
 */
export function formatDateTime(isoDate: string): string {
  return formatter('dateTime', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate))
}

export function formatDate(isoDate: string): string {
  return formatter('date', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(isoDate))
}

/** Format compact des cartes Kanban, comme la capture : « 24/09 · 18:00 ». */
export function formatShortDateTime(isoDate: string): string {
  const date = new Date(isoDate)
  const day = formatter('shortDate', { day: '2-digit', month: '2-digit' }).format(date)
  return `${day} · ${formatter('time', { hour: '2-digit', minute: '2-digit' }).format(date)}`
}

/** ISO → valeur d'un `<input type="datetime-local">` (heure locale, sans fuseau). */
export function toDateTimeLocalValue(isoDate: string | undefined): string {
  if (!isoDate) {
    return ''
  }
  const date = new Date(isoDate)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/** Valeur d'un `<input type="datetime-local">` → ISO UTC pour le serveur. */
export function fromDateTimeLocalValue(localValue: string): string | undefined {
  if (!localValue) {
    return undefined
  }
  const parsed = new Date(localValue)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

/** Une échéance dépassée mérite un signalement visuel (sauf tâche terminée, vu par l'appelant). */
export function isOverdue(dueDate: string | undefined): boolean {
  return dueDate !== undefined && isPast(dueDate)
}

export function isPast(isoDate: string): boolean {
  return new Date(isoDate).getTime() <= Date.now()
}
