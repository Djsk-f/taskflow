import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { LogOutIcon, MenuIcon, UserRoundIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

type TopbarProps = {
  title: string
  action?: ReactNode
  onOpenMenu: () => void
}

/** En-tête de contenu : titre, action primaire, menu utilisateur. */
export function Topbar({ title, action, onOpenMenu }: TopbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = (user?.fullName ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <header className="flex items-center gap-3 px-4 py-5 sm:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="Ouvrir le menu">
        <MenuIcon className="size-5" />
      </Button>

      <h1 className="flex-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>

      {action}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="bg-success text-primary-foreground focus-visible:ring-ring flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label="Menu utilisateur"
          >
            {initials || <UserRoundIcon className="size-4" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate font-normal">
            <span className="block font-medium">{user?.fullName}</span>
            <span className="text-muted-foreground block text-xs">{user?.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/profile')}>
            <UserRoundIcon className="size-4" />
            Mon profil
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={logout}>
            <LogOutIcon className="size-4" />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
