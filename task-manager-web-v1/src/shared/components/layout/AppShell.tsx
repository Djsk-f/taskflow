import { SidebarContent } from '@/shared/components/layout/Sidebar'
import { Topbar } from '@/shared/components/layout/Topbar'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'
import { useState, type ReactNode } from 'react'

type AppShellProps = {
  title: string
  action?: ReactNode
  children: ReactNode
}

/**
 * Coquille de l'application : sidebar fixe à partir de 1024 px, tiroir en dessous (EX-13).
 */
export function AppShell({ title, action, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <aside className="bg-card hidden w-60 shrink-0 border-r lg:block">
        <SidebarContent />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} action={action} onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 px-4 pb-8 sm:px-8">{children}</main>
      </div>
    </div>
  )
}
