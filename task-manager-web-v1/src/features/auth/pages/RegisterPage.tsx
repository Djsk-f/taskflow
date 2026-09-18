import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { registerSchema, type RegisterValues } from '@/features/auth/schemas'
import { useAuth } from '@/features/auth/useAuth'
import { FormAlert } from '@/shared/components/feedback/FormAlert'
import { applyApiErrorToForm } from '@/shared/components/form/applyApiErrorToForm'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { Button } from '@/shared/ui/button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [alert, setAlert] = useState<string | null>(null)
  const { t } = useTranslation()

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  })

  const onSubmit = async (values: RegisterValues) => {
    setAlert(null)
    try {
      await register(values)
      navigate('/tasks', { replace: true })
    } catch (error) {
      setAlert(applyApiErrorToForm(error, form.setError))
    }
  }

  return (
    <AuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <>
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('auth.register.toLogin')}
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {alert && <FormAlert message={alert} />}

        <FormTextField
          control={form.control}
          name="fullName"
          label={t('auth.fields.fullName')}
          placeholder={t('auth.placeholders.fullName')}
          autoComplete="name"
        />
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
          placeholder={t('auth.placeholders.passwordField')}
          autoComplete="new-password"
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
