import { cn } from '@/shared/lib/utils'
import { CircleCheckBigIcon, ListChecksIcon, MoonIcon, SettingsIcon, UserRoundIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/tasks', label: 'Tâches', icon: ListChecksIcon },
  { to: '/profile', label: 'Profil', icon: UserRoundIcon },
] as const

/**
 * Sidebar de la capture de référence : logo, section MENU, élément actif en pilule bleue.
 * `Réglages` et `Mode sombre` y figurent visuellement mais sont **désactivés** : la
 * charte interdit d'exposer un contrôle qui ne fonctionne pas (INV-01, bonus B-02).
 */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
          <CircleCheckBigIcon className="size-5" />
        </span>
        <span className="text-primary text-lg font-bold">TaskFlow</span>
      </div>

      <p className="text-muted-foreground px-5 pb-2 text-xs font-medium tracking-widest uppercase">Menu</p>

      <nav className="space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="text-muted-foreground mt-auto space-y-1 px-3 pb-5 text-sm">
        <span className="flex cursor-not-allowed items-center gap-3 px-3 py-2.5 opacity-50" aria-disabled="true">
          <SettingsIcon className="size-4" />
          Réglages
          <span className="ml-auto text-xs">bientôt</span>
        </span>
        <span className="flex cursor-not-allowed items-center gap-3 px-3 py-2.5 opacity-50" aria-disabled="true">
          <MoonIcon className="size-4" />
          Mode sombre
          <span className="ml-auto text-xs">bientôt</span>
        </span>
      </div>
    </div>
  )
}
