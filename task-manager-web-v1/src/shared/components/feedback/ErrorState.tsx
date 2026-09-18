import { Button } from '@/shared/ui/button'
import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'

/** État d'erreur : affiche le message du serveur et propose de réessayer (EX-12). */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-full">
        <TriangleAlertIcon className="size-6" />
      </span>
      <h2 className="font-semibold">Chargement impossible</h2>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">{message}</p>
      <Button variant="secondary" className="mt-5" onClick={onRetry}>
        <RefreshCwIcon className="size-4" />
        Réessayer
      </Button>
    </div>
  )
}
