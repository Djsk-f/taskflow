import { useAuth } from '@/features/auth/useAuth'
import { ChangePasswordForm } from '@/features/profile/components/ChangePasswordForm'
import { ProfileForm } from '@/features/profile/components/ProfileForm'
import { AppShell } from '@/shared/components/layout/AppShell'
import { formatDate } from '@/shared/lib/formatDate'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export function ProfilePage() {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <AppShell title={t('profile.title')}>
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card
          title={t('profile.info.title')}
          description={user ? t('profile.info.createdAt', { date: formatDate(user.createdAt) }) : ''}
        >
          <ProfileForm />
        </Card>

        <Card title={t('profile.password.title')} description={t('profile.password.hint')}>
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
