import type { LucideIcon } from 'lucide-react'

/** Bandeau d'information (pas une erreur) en tête de formulaire : session expirée, brouillon repris… */
export function FormNotice({ message, icon: Icon }: { message: string; icon: LucideIcon }) {
  return (
    <p role="status" className="bg-secondary text-secondary-foreground flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  )
}
