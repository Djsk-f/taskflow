import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { loginSchema, type LoginValues } from '@/features/auth/schemas'
import { useAuth } from '@/features/auth/useAuth'
import { FormAlert } from '@/shared/components/feedback/FormAlert'
import { applyApiErrorToForm } from '@/shared/components/form/applyApiErrorToForm'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { Button } from '@/shared/ui/button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [alert, setAlert] = useState<string | null>(null)

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
      title="Connexion"
      subtitle="Accéder à vos tâches"
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {alert && <FormAlert message={alert} />}

        <FormTextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          placeholder="vous@example.com"
          autoComplete="email"
        />
        <FormTextField
          control={form.control}
          name="password"
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>
    </AuthLayout>
  )
}
