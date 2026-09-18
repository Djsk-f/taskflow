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
      {/* Deux lignes réservées au libellé : les chiffres restent alignés d'une tuile à l'autre. */}
      <div className="text-muted-foreground flex min-h-10 items-start gap-2 text-sm">
        <Icon className={cn('mt-0.5 size-4 shrink-0', alert && 'text-destructive')} />
        <span className="line-clamp-2">{label}</span>
      </div>
      <p className={cn('mt-2 text-3xl font-bold tracking-tight', alert && 'text-destructive')}>{value}</p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  )
}
