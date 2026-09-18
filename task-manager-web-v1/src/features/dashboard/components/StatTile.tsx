import { cn } from '@/shared/lib/utils'
import type { LucideIcon } from 'lucide-react'

type StatTileProps = {
  label: string
  value: number | string
  hint?: string
  icon: LucideIcon
  /** Mise en avant d'un état à surveiller (retard) : icône et valeur, jamais la couleur seule. */
  alert?: boolean
}

/** Tuile de chiffre clé : libellé, valeur, précision facultative. */
export function StatTile({ label, value, hint, icon: Icon, alert = false }: StatTileProps) {
  return (
    <div className="bg-card shadow-card rounded-card border p-5">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Icon className={cn('size-4', alert && 'text-destructive')} />
        {label}
      </div>
      <p className={cn('mt-2 text-3xl font-bold tracking-tight', alert && 'text-destructive')}>{value}</p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  )
}
