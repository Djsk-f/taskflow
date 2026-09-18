import { cn } from '@/shared/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

type StatTileProps = {
  label: string
  value: number | string
  hint?: string
  icon: LucideIcon
  /** Mise en avant d'un état à surveiller (retard) : icône et valeur, jamais la couleur seule. */
  alert?: boolean
  /** Liste qui détaille ce chiffre : « 3 en retard » ouvre ces 3 tâches. */
  to: string
  className?: string
}

/** Tuile de chiffre clé : libellé, valeur, précision facultative ; toute la tuile est un lien. */
export function StatTile({ label, value, hint, icon: Icon, alert = false, to, className }: StatTileProps) {
  return (
    <Link
      to={to}
      className={cn(
        'bg-card shadow-card rounded-card focus-visible:ring-ring/50 block border p-4 transition-shadow outline-none hover:shadow-[var(--shadow-card-hover)] focus-visible:ring-[3px] sm:p-5',
        className,
      )}
    >
      {/* Deux lignes réservées au libellé : les chiffres restent alignés d'une tuile à l'autre. */}
      <span className="text-muted-foreground flex min-h-10 items-start gap-2 text-sm">
        <Icon className={cn('mt-0.5 size-4 shrink-0', alert && 'text-destructive')} />
        <span className="line-clamp-2">{label}</span>
      </span>
      <span className={cn('mt-2 block text-3xl font-bold tracking-tight', alert && 'text-destructive')}>{value}</span>
      {hint && <span className="text-muted-foreground mt-1 block text-xs">{hint}</span>}
    </Link>
  )
}
