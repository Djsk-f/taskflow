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
import { Link, useNavigate } from 'react-router-dom'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [alert, setAlert] = useState<string | null>(null)

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
      title="Créer un compte"
      subtitle="Quelques secondes suffisent"
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {alert && <FormAlert message={alert} />}

        <FormTextField
          control={form.control}
          name="fullName"
          label="Nom complet"
          placeholder="Fidèle Kounga"
          autoComplete="name"
        />
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
          placeholder="8 caractères minimum"
          autoComplete="new-password"
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Création…' : 'Créer mon compte'}
        </Button>
      </form>
    </AuthLayout>
  )
}
