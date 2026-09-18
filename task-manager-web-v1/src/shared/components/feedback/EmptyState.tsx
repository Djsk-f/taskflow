import { Button } from '@/shared/ui/button'
import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

/** État vide : une seule implémentation pour toute l'application (INV-21). */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full">
        <Icon className="size-6" />
      </span>
      <h2 className="font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>
      {action && (
        <Button className="mt-5" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
