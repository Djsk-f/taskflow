import { TriangleAlertIcon } from 'lucide-react'

/** Bandeau d'erreur non liée à un champ (identifiants invalides, serveur injoignable…). */
export function FormAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm"
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
