import { useAuth } from '@/features/auth/useAuth'
import { profileApi } from '@/features/profile/api/profileApi'
import { profileSchema, type ProfileValues } from '@/features/profile/schemas'
import { FormAlert } from '@/shared/components/feedback/FormAlert'
import { applyApiErrorToForm } from '@/shared/components/form/applyApiErrorToForm'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { Button } from '@/shared/ui/button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

/** Modification du nom et de l'email (EX-03). */
export function ProfileForm() {
  const { user, updateUser } = useAuth()
  const [alert, setAlert] = useState<string | null>(null)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName ?? '', email: user?.email ?? '' },
  })

  const onSubmit = async (values: ProfileValues) => {
    setAlert(null)
    try {
      const updated = await profileApi.update(values)
      updateUser(updated)
      form.reset({ fullName: updated.fullName, email: updated.email })
      toast.success('Profil mis à jour.')
    } catch (error) {
      setAlert(applyApiErrorToForm(error, form.setError))
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {alert && <FormAlert message={alert} />}

      <FormTextField control={form.control} name="fullName" label="Nom complet" autoComplete="name" />
      <FormTextField control={form.control} name="email" label="Email" type="email" autoComplete="email" />

      <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
        {form.formState.isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </form>
  )
}
