import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { loginSchema, type LoginValues } from '@/features/auth/schemas'
import { useAuth } from '@/features/auth/useAuth'
import { FormAlert } from '@/shared/components/feedback/FormAlert'
import { FormNotice } from '@/shared/components/feedback/FormNotice'
import { applyApiErrorToForm } from '@/shared/components/form/applyApiErrorToForm'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { Button } from '@/shared/ui/button'
import { zodResolver } from '@hookform/resolvers/zod'
import { TimerOffIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export function LoginPage() {
  const { login, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [alert, setAlert] = useState<string | null>(null)
  const { t } = useTranslation()

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginValues) => {
    setAlert(null)
    try {
      await login(values)
      // Retour à la page demandée avant la redirection vers la connexion.
      const target = (location.state as { from?: string } | null)?.from ?? '/tasks'
      navigate(target, { replace: true })
    } catch (error) {
      setAlert(applyApiErrorToForm(error, form.setError))
    }
  }

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            {t('auth.login.toRegister')}
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {alert && <FormAlert message={alert} />}
        {!alert && sessionExpired && <FormNotice icon={TimerOffIcon} message={t('auth.sessionExpired')} />}

        <FormTextField
          control={form.control}
          name="email"
          label={t('auth.fields.email')}
          type="email"
          placeholder={t('auth.placeholders.email')}
          autoComplete="email"
        />
        <FormTextField
          control={form.control}
          name="password"
          label={t('auth.fields.passwordField')}
          type="password"
          autoComplete="current-password"
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
