import { useAuth } from '@/features/auth/useAuth'
import { ChangePasswordForm } from '@/features/profile/components/ChangePasswordForm'
import { ProfileForm } from '@/features/profile/components/ProfileForm'
import { AppShell } from '@/shared/components/layout/AppShell'
import { formatDate } from '@/shared/lib/formatDate'
import type { ReactNode } from 'react'

export function ProfilePage() {
  const { user } = useAuth()

  return (
    <AppShell title="Profil">
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card
          title="Informations personnelles"
          description={user ? `Compte créé le ${formatDate(user.createdAt)}` : ''}
        >
          <ProfileForm />
        </Card>

        <Card title="Mot de passe" description="Huit caractères minimum.">
          <ChangePasswordForm />
        </Card>
      </div>
    </AppShell>
  )
}

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="bg-card shadow-card rounded-card border p-6">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-0.5 mb-5 text-sm">{description}</p>
      {children}
    </section>
  )
}
