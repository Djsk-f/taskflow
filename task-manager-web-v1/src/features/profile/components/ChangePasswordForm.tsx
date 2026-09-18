import { profileApi } from '@/features/profile/api/profileApi'
import { passwordSchema, type PasswordValues } from '@/features/profile/schemas'
import { FormAlert } from '@/shared/components/feedback/FormAlert'
import { applyApiErrorToForm } from '@/shared/components/form/applyApiErrorToForm'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { Button } from '@/shared/ui/button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

const EMPTY: PasswordValues = { currentPassword: '', newPassword: '', confirmation: '' }

/** Changement de mot de passe (EX-03). Le serveur vérifie le mot de passe actuel. */
export function ChangePasswordForm() {
  const [alert, setAlert] = useState<string | null>(null)

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: EMPTY,
  })

  const onSubmit = async (values: PasswordValues) => {
    setAlert(null)
    try {
      await profileApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      form.reset(EMPTY)
      toast.success('Mot de passe modifié.')
    } catch (error) {
      setAlert(applyApiErrorToForm(error, form.setError))
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {alert && <FormAlert message={alert} />}

      <FormTextField
        control={form.control}
        name="currentPassword"
        label="Mot de passe actuel"
        type="password"
        autoComplete="current-password"
      />
      <FormTextField
        control={form.control}
        name="newPassword"
        label="Nouveau mot de passe"
        type="password"
        autoComplete="new-password"
      />
      <FormTextField
        control={form.control}
        name="confirmation"
        label="Confirmer le nouveau mot de passe"
        type="password"
        autoComplete="new-password"
      />

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Modification…' : 'Modifier le mot de passe'}
      </Button>
    </form>
  )
}
