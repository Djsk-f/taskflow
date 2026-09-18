import { useAuth } from '@/features/auth/useAuth'
import { NotificationBell } from '@/features/tasks/components/NotificationBell'
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
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  const initials = (user?.fullName ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <header className="flex items-center gap-3 px-4 py-5 sm:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label={t('nav.open')}>
        <MenuIcon className="size-5" />
      </Button>

      <h1 className="flex-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>

      {action}

      <NotificationBell />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="bg-status-done text-primary-foreground focus-visible:ring-ring flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label={t('user.menu')}
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
            {t('user.profile')}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={logout}>
            <LogOutIcon className="size-4" />
            {t('user.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
