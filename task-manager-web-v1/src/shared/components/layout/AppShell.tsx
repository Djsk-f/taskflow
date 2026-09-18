import { SidebarContent } from '@/shared/components/layout/Sidebar'
import { Topbar } from '@/shared/components/layout/Topbar'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type AppShellProps = {
  title: string
  /** Action primaire de l'en-tête (ex. « Créer une tâche »). */
  action?: ReactNode
  /** Barre sous le titre, dans la zone blanche : onglets de vue, filtres. */
  toolbar?: ReactNode
  children: ReactNode
}

/**
 * Coquille de la capture : sidebar blanche fixe à partir de 1024 px (tiroir en dessous),
 * en-tête blanc bordé (titre, action, barre d'outils), contenu sur fond gris clair (EX-13).
 */
export function AppShell({ title, action, toolbar, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen">
      <aside className="bg-card sticky top-0 hidden h-screen w-60 shrink-0 border-r lg:block">
        <SidebarContent />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">{t('nav.drawer')}</SheetTitle>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="bg-card border-b">
          <Topbar title={title} action={action} onOpenMenu={() => setMenuOpen(true)} />
          {toolbar && <div className="px-4 pb-3 sm:px-8">{toolbar}</div>}
        </div>
        <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  )
}
