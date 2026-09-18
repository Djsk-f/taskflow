import { Loader2Icon } from 'lucide-react'

/** Affiché pendant la restauration de session, avant de savoir si l'on est connecté. */
export function FullPageLoader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2Icon className="size-4 animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  )
}
