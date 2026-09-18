import { cn } from '@/shared/lib/utils'
import { useTheme } from '@/shared/theme/useTheme'
import { Switch } from '@/shared/ui/switch'
import {
  CircleCheckBigIcon,
  LayoutGridIcon,
  MoonIcon,
  SettingsIcon,
  SquareCheckBigIcon,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

type NavItem = { to: string; label: string; icon: LucideIcon }

const MENU: NavItem[] = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutGridIcon },
  { to: '/tasks', label: 'Tâches', icon: SquareCheckBigIcon },
]

const FOOTER: NavItem[] = [{ to: '/profile', label: 'Paramètres', icon: SettingsIcon }]

/**
 * Sidebar de la capture : logo, section MENU, élément actif en pilule bleue pleine,
 * « Paramètres » et « Mode sombre » en pied. Les sections d'intégrations de la capture
 * (Slack, GitHub…) ne sont pas reprises : TaskFlow n'a pas ces intégrations.
 */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full">
          <CircleCheckBigIcon className="size-4.5" />
        </span>
        <span className="text-primary text-lg font-bold tracking-tight">TaskFlow</span>
      </div>

      <p className="text-muted-foreground px-6 pb-2 text-xs font-medium tracking-widest uppercase">Menu</p>
      <nav aria-label="Navigation principale" className="space-y-1 px-3">
        {MENU.map((item) => (
          <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t px-3 py-4">
        {FOOTER.map((item) => (
          <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
        <DarkModeToggle />
      </div>
    </div>
  )
}

/** Bascule du mode sombre, en pied de sidebar comme sur la capture. */
function DarkModeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <label className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors">
      <MoonIcon className="size-4" />
      Mode sombre
      <Switch
        className="ml-auto"
        checked={theme === 'dark'}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      />
    </label>
  )
}

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )
      }
    >
      <item.icon className="size-4" />
      {item.label}
    </NavLink>
  )
}
