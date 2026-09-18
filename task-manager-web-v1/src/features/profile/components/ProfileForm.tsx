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
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

/** Modification du nom et de l'email (EX-03). */
export function ProfileForm() {
  const { user, updateUser } = useAuth()
  const [alert, setAlert] = useState<string | null>(null)
  const { t } = useTranslation()

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
      toast.success(t('profile.updated'))
    } catch (error) {
      setAlert(applyApiErrorToForm(error, form.setError))
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {alert && <FormAlert message={alert} />}

      <FormTextField control={form.control} name="fullName" label={t('auth.fields.fullName')} autoComplete="name" />
      <FormTextField control={form.control} name="email" label={t('auth.fields.email')} type="email" autoComplete="email" />

      <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
        {form.formState.isSubmitting ? t('common.saving') : t('common.save')}
      </Button>
    </form>
  )
}
