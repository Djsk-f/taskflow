import { CircleCheckBigIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type AuthLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

/** Gabarit commun aux écrans de connexion et d'inscription. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <CircleCheckBigIcon className="size-5" />
          </span>
          <span className="text-primary text-xl font-bold">TaskFlow</span>
        </div>

        <div className="bg-card shadow-card rounded-card border p-6 sm:p-8">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-muted-foreground mt-1 mb-6 text-sm">{subtitle}</p>
          {children}
        </div>

        <p className="text-muted-foreground mt-6 text-center text-sm">{footer}</p>
      </div>
    </div>
  )
}
