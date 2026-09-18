const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

const shortDateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' })
const timeFormatter = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

/**
 * Formatage et conversion des dates, sans dépendance : `Intl` fait le travail (INV-24).
 * Le serveur échange des instants ISO-8601 en UTC ; l'affichage et les champs de
 * formulaire vivent dans le fuseau du navigateur.
 */
export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate))
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}

/** Format compact des cartes Kanban, comme la capture : « 24/09 · 18:00 ». */
export function formatShortDateTime(isoDate: string): string {
  const date = new Date(isoDate)
  return `${shortDateFormatter.format(date)} · ${timeFormatter.format(date)}`
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
  return dueDate !== undefined && new Date(dueDate).getTime() < Date.now()
}
